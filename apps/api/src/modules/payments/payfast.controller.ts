import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { verifyItnSignature, confirmWithPayFast } from "../../services/payfast.service.js";

// PayFast's Instant Transaction Notification — THIS, not the browser return_url
// redirect, is the only trustworthy signal that money actually changed hands.
// A customer can land on return_url just by navigating there manually, paid or
// not; PayFast's own server calling this endpoint directly is the real proof.
//
// No auth middleware here on purpose — PayFast's server is the caller, not a
// logged-in user. Trust is established by the two checks below instead:
// signature verification + PayFast's own server-to-server confirmation.
export const handleNotify = catchAsync(async (req: Request, res: Response) => {
  const body = req.body as Record<string, string>;

  // Always 200 once we've looked at the payload — PayFast retries on non-2xx,
  // and retrying a request we've already judged invalid/fraudulent just wastes
  // both sides' time. We simply don't act on anything that fails verification.
  const ack = () => res.status(HttpStatus.OK).send("OK");

  if (!verifyItnSignature(body)) {
    console.error("[PayFast ITN] signature mismatch — ignoring", { m_payment_id: body.m_payment_id });
    return ack();
  }

  if (!req.rawBody || !(await confirmWithPayFast(req.rawBody))) {
    console.error("[PayFast ITN] server-to-server validation failed — ignoring", { m_payment_id: body.m_payment_id });
    return ack();
  }

  const transaction = await prisma.paymentTransaction.findFirst({ where: { mPaymentId: body.m_payment_id } });
  if (!transaction) {
    console.error("[PayFast ITN] no matching PaymentTransaction — ignoring", { m_payment_id: body.m_payment_id });
    return ack();
  }

  // ITN can legitimately arrive more than once for the same payment (PayFast
  // retries until it gets a 200, and network hiccups can duplicate delivery
  // even after that). Once we've already recorded this as COMPLETE, treat any
  // further delivery as a no-op rather than trying to create the purchase twice.
  if (transaction.status === "COMPLETE") return ack();

  const expectedCents = transaction.amountCents;
  const postedCents = Math.round(parseFloat(body.amount_gross || "0") * 100);
  if (postedCents !== expectedCents) {
    console.error("[PayFast ITN] amount mismatch — ignoring", { expectedCents, postedCents, m_payment_id: body.m_payment_id });
    return ack();
  }

  if (body.payment_status !== "COMPLETE") {
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: { status: body.payment_status === "CANCELLED" ? "CANCELLED" : "FAILED", rawPayload: body },
    });
    return ack();
  }

  if (transaction.purpose === "ALBUM_PURCHASE") {
    const albumId = transaction.referenceId; // set to the albumId at initiation — see music.controller.ts
    await prisma.$transaction(async (tx) => {
      await tx.paymentTransaction.update({
        where: { id: transaction.id },
        data: { status: "COMPLETE", pfPaymentId: body.pf_payment_id, rawPayload: body },
      });
      // upsert: a duplicate ITN delivery that raced past the status check above
      // (two deliveries processed concurrently) would otherwise hit the
      // AlbumPurchase table's own userId+albumId unique constraint and throw.
      await tx.albumPurchase.upsert({
        where: { userId_albumId: { userId: transaction.userId, albumId } },
        create: { userId: transaction.userId, albumId, priceCents: transaction.amountCents, currency: transaction.currency },
        update: {},
      });
    });
  } else {
    // MERCH_ORDER isn't wired to real payment yet — checkout() still creates
    // Orders directly. Nothing should reach here until that's built, but
    // logging loudly beats silently dropping real money's confirmation.
    console.error("[PayFast ITN] MERCH_ORDER completion received but not yet handled", { m_payment_id: body.m_payment_id });
  }

  return ack();
});
