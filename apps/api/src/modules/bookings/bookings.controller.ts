import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus, Role } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/appError.js";
import {
  sendBookingNotificationEmail, sendBookingAcknowledgmentEmail, sendBookingReplyEmail,
} from "../../services/mail.service.js";

async function getEnabledEventTypeLabels(): Promise<string[]> {
  const options = await prisma.bookingEventTypeOption.findMany({
    where: { isEnabled: true }, orderBy: { order: "asc" },
  });
  return options.map((o) => o.label);
}

// ── PUBLIC ──────────────────────────────────────────────────────────────────────

export const publicGetEventTypes = catchAsync(async (_req: Request, res: Response) => {
  const enabledEventTypes = await getEnabledEventTypeLabels();
  return res.status(HttpStatus.OK).json({ status: "success", data: { enabledEventTypes } });
});

export const submitInquiry = catchAsync(async (req: Request, res: Response) => {
  const { name, phone, eventType, eventDate, venue, eventDetails, message } = req.body;
  const email = req.user!.email;
  if (!name) throw new AppError("Name is required", HttpStatus.BAD_REQUEST);
  if (eventType) {
    const enabled = await getEnabledEventTypeLabels();
    if (!enabled.includes(eventType)) throw new AppError("That event type isn't currently offered", HttpStatus.BAD_REQUEST);
  }

  const inquiry = await prisma.bookingInquiry.create({
    data: {
      name, email, phone: phone ?? null,
      eventType: eventType ?? null,
      eventDate: eventDate ? new Date(eventDate) : null,
      venue: venue ?? null,
      eventDetails: eventDetails ?? null,
      message: message ?? null,
    },
  });

  const staff = await prisma.user.findMany({
    where: { role: { in: [Role.ADMIN, Role.SUPER_ADMIN] }, accountStatus: "ACTIVE" },
    select: { email: true },
  });
  await sendBookingNotificationEmail(staff.map((s) => s.email), {
    name, email, phone,
    eventType, eventDate, venue, eventDetails, message,
  }).catch((err) => console.error("[BOOKINGS] Failed to send staff notification email:", err.message));

  await sendBookingAcknowledgmentEmail(email, name)
    .catch((err) => console.error("[BOOKINGS] Failed to send acknowledgment email:", err.message));

  return res.status(HttpStatus.CREATED).json({ status: "success", data: { id: inquiry.id } });
});

// ── ADMIN ───────────────────────────────────────────────────────────────────────

export const adminListInquiries = catchAsync(async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const where = status ? { status: status as any } : {};

  const inquiries = await prisma.bookingInquiry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { replies: { orderBy: { createdAt: "asc" } } },
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

export const adminUpdateNotes = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { internalNotes } = req.body;

  const existing = await prisma.bookingInquiry.findUnique({ where: { id } });
  if (!existing) throw new AppError("Inquiry not found", HttpStatus.NOT_FOUND);

  const inquiry = await prisma.bookingInquiry.update({ where: { id }, data: { internalNotes: internalNotes ?? null } });
  return res.status(HttpStatus.OK).json({ status: "success", data: { inquiry } });
});

export const adminListEventTypes = catchAsync(async (_req: Request, res: Response) => {
  const eventTypes = await prisma.bookingEventTypeOption.findMany({ orderBy: { order: "asc" } });
  return res.status(HttpStatus.OK).json({ status: "success", data: { eventTypes } });
});

export const adminCreateEventType = catchAsync(async (req: Request, res: Response) => {
  const label = (req.body.label as string | undefined)?.trim();
  if (!label) throw new AppError("Label is required", HttpStatus.BAD_REQUEST);

  const existing = await prisma.bookingEventTypeOption.findFirst({
    where: { label: { equals: label, mode: "insensitive" } },
  });
  if (existing) throw new AppError("An event type with that name already exists", HttpStatus.BAD_REQUEST);

  const last = await prisma.bookingEventTypeOption.findFirst({ orderBy: { order: "desc" } });
  const eventType = await prisma.bookingEventTypeOption.create({
    data: { label, order: (last?.order ?? -1) + 1 },
  });
  return res.status(HttpStatus.CREATED).json({ status: "success", data: { eventType } });
});

export const adminUpdateEventType = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { label, isEnabled } = req.body as { label?: string; isEnabled?: boolean };

  const existing = await prisma.bookingEventTypeOption.findUnique({ where: { id } });
  if (!existing) throw new AppError("Event type not found", HttpStatus.NOT_FOUND);

  if (isEnabled === false && existing.isEnabled) {
    const enabledCount = await prisma.bookingEventTypeOption.count({ where: { isEnabled: true } });
    if (enabledCount <= 1) throw new AppError("At least one event type must stay enabled", HttpStatus.BAD_REQUEST);
  }

  const trimmedLabel = label?.trim();
  if (label !== undefined && !trimmedLabel) throw new AppError("Label cannot be empty", HttpStatus.BAD_REQUEST);
  if (trimmedLabel && trimmedLabel.toLowerCase() !== existing.label.toLowerCase()) {
    const duplicate = await prisma.bookingEventTypeOption.findFirst({
      where: { label: { equals: trimmedLabel, mode: "insensitive" }, id: { not: id } },
    });
    if (duplicate) throw new AppError("An event type with that name already exists", HttpStatus.BAD_REQUEST);
  }

  const eventType = await prisma.bookingEventTypeOption.update({
    where: { id },
    data: {
      ...(trimmedLabel ? { label: trimmedLabel } : {}),
      ...(isEnabled !== undefined ? { isEnabled } : {}),
    },
  });
  return res.status(HttpStatus.OK).json({ status: "success", data: { eventType } });
});

export const adminDeleteEventType = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.bookingEventTypeOption.findUnique({ where: { id } });
  if (!existing) throw new AppError("Event type not found", HttpStatus.NOT_FOUND);

  if (existing.isEnabled) {
    const enabledCount = await prisma.bookingEventTypeOption.count({ where: { isEnabled: true } });
    if (enabledCount <= 1) throw new AppError("At least one event type must stay enabled", HttpStatus.BAD_REQUEST);
  }

  await prisma.bookingEventTypeOption.delete({ where: { id } });
  return res.status(HttpStatus.OK).json({ status: "success", data: null });
});

export const adminReplyToInquiry = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { message } = req.body;
  if (!message?.trim()) throw new AppError("Reply message is required", HttpStatus.BAD_REQUEST);

  const inquiry = await prisma.bookingInquiry.findUnique({ where: { id } });
  if (!inquiry) throw new AppError("Inquiry not found", HttpStatus.NOT_FOUND);

  await sendBookingReplyEmail(inquiry.email, inquiry.name, message.trim());

  const reply = await prisma.bookingReply.create({
    data: { bookingInquiryId: id, message: message.trim(), sentByEmail: req.user!.email },
  });

  // A reply is a strong signal the inquiry is being worked — auto-advance
  // out of NEW so it doesn't sit looking unactioned in the queue.
  if (inquiry.status === "NEW") {
    await prisma.bookingInquiry.update({ where: { id }, data: { status: "CONTACTED" } });
  }

  return res.status(HttpStatus.CREATED).json({ status: "success", data: { reply } });
});
