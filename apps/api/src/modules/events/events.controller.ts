import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/appError.js";

// ── ADMIN ───────────────────────────────────────────────────────────────────────

export const adminListEvents = catchAsync(async (_req: Request, res: Response) => {
  const events = await prisma.event.findMany({ orderBy: { date: "desc" } });
  return res.status(HttpStatus.OK).json({ status: "success", data: { events } });
});

export const adminCreateEvent = catchAsync(async (req: Request, res: Response) => {
  const { title, description, venue, city, date, ticketUrl, imageUrl, category } = req.body;
  if (!title) throw new AppError("Title is required", HttpStatus.BAD_REQUEST);
  if (!venue) throw new AppError("Venue is required", HttpStatus.BAD_REQUEST);
  if (!date) throw new AppError("Date is required", HttpStatus.BAD_REQUEST);
  if (category && !["GENERAL", "HARINAM"].includes(category))
    throw new AppError("Invalid category", HttpStatus.BAD_REQUEST);

  const event = await prisma.event.create({
    data: {
      title, venue,
      description: description ?? null,
      city: city ?? null,
      date: new Date(date),
      ticketUrl: ticketUrl ?? null,
      imageUrl: imageUrl ?? null,
      category: category ?? "GENERAL",
    },
  });

  return res.status(HttpStatus.CREATED).json({ status: "success", data: { event } });
});

export const adminUpdateEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, venue, city, date, ticketUrl, imageUrl, category } = req.body;

  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) throw new AppError("Event not found", HttpStatus.NOT_FOUND);
  if (category && !["GENERAL", "HARINAM"].includes(category))
    throw new AppError("Invalid category", HttpStatus.BAD_REQUEST);

  const event = await prisma.event.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(venue !== undefined && { venue }),
      ...(city !== undefined && { city }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(ticketUrl !== undefined && { ticketUrl }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(category !== undefined && { category }),
    },
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: { event } });
});

export const adminDeleteEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) throw new AppError("Event not found", HttpStatus.NOT_FOUND);

  await prisma.event.delete({ where: { id } });
  return res.status(HttpStatus.OK).json({ status: "success", message: "Event deleted" });
});

// ── PUBLIC ──────────────────────────────────────────────────────────────────────

export const listEvents = catchAsync(async (req: Request, res: Response) => {
  const category = req.query.category as "GENERAL" | "HARINAM" | undefined;
  const where = category && ["GENERAL", "HARINAM"].includes(category) ? { category } : {};

  const events = await prisma.event.findMany({ where, orderBy: { date: "asc" } });
  return res.status(HttpStatus.OK).json({ status: "success", data: { events } });
});

export const getEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw new AppError("Event not found", HttpStatus.NOT_FOUND);
  return res.status(HttpStatus.OK).json({ status: "success", data: { event } });
});
