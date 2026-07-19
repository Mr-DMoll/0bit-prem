import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus, Role } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/appError.js";
import { sendBookingNotificationEmail } from "../../services/mail.service.js";

// ── PUBLIC ──────────────────────────────────────────────────────────────────────

export const submitInquiry = catchAsync(async (req: Request, res: Response) => {
  const { name, email, phone, eventDetails, message } = req.body;
  if (!name) throw new AppError("Name is required", HttpStatus.BAD_REQUEST);
  if (!email) throw new AppError("Email is required", HttpStatus.BAD_REQUEST);
  if (!eventDetails) throw new AppError("Event details are required", HttpStatus.BAD_REQUEST);

  const inquiry = await prisma.bookingInquiry.create({
    data: { name, email, phone: phone ?? null, eventDetails, message: message ?? null },
  });

  const staff = await prisma.user.findMany({
    where: { role: { in: [Role.ADMIN, Role.SUPER_ADMIN] }, accountStatus: "ACTIVE" },
    select: { email: true },
  });
  await sendBookingNotificationEmail(staff.map((s) => s.email), { name, email, phone, eventDetails, message })
    .catch((err) => console.error("[BOOKINGS] Failed to send notification email:", err.message));

  return res.status(HttpStatus.CREATED).json({ status: "success", data: { id: inquiry.id } });
});

// ── ADMIN ───────────────────────────────────────────────────────────────────────

export const adminListInquiries = catchAsync(async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const where = status ? { status: status as any } : {};

  const inquiries = await prisma.bookingInquiry.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: { inquiries } });
});

export const adminUpdateInquiryStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const valid = ["NEW", "CONTACTED", "CONFIRMED", "DECLINED", "ARCHIVED"];
  if (!valid.includes(status)) throw new AppError("Invalid status value", HttpStatus.BAD_REQUEST);

  const existing = await prisma.bookingInquiry.findUnique({ where: { id } });
  if (!existing) throw new AppError("Inquiry not found", HttpStatus.NOT_FOUND);

  const inquiry = await prisma.bookingInquiry.update({ where: { id }, data: { status } });
  return res.status(HttpStatus.OK).json({ status: "success", data: { inquiry } });
});
