import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/appError.js";

// ── ADMIN ───────────────────────────────────────────────────────────────────────

export const adminListImages = catchAsync(async (_req: Request, res: Response) => {
  const images = await prisma.galleryImage.findMany({ orderBy: { order: "asc" } });
  return res.status(HttpStatus.OK).json({ status: "success", data: { images } });
});

export const adminCreateImage = catchAsync(async (req: Request, res: Response) => {
  const { url, caption } = req.body;
  if (!url) throw new AppError("Image URL is required", HttpStatus.BAD_REQUEST);

  const last = await prisma.galleryImage.findFirst({ orderBy: { order: "desc" } });
  const nextOrder = (last?.order ?? -1) + 1;

  const image = await prisma.galleryImage.create({
    data: { url, caption: caption ?? null, order: nextOrder },
  });

  return res.status(HttpStatus.CREATED).json({ status: "success", data: { image } });
});

export const adminUpdateImage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { caption, swapWithOrder } = req.body;

  const image = await prisma.galleryImage.findUnique({ where: { id } });
  if (!image) throw new AppError("Image not found", HttpStatus.NOT_FOUND);

  if (swapWithOrder !== undefined) {
    const other = await prisma.galleryImage.findFirst({ where: { order: swapWithOrder } });
    if (other) {
      await prisma.$transaction([
        prisma.galleryImage.update({ where: { id: image.id }, data: { order: swapWithOrder } }),
        prisma.galleryImage.update({ where: { id: other.id }, data: { order: image.order } }),
      ]);
    }
  }

  const updated = await prisma.galleryImage.update({
    where: { id },
    data: { ...(caption !== undefined && { caption }) },
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: { image: updated } });
});

export const adminDeleteImage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.galleryImage.findUnique({ where: { id } });
  if (!existing) throw new AppError("Image not found", HttpStatus.NOT_FOUND);

  await prisma.galleryImage.delete({ where: { id } });
  return res.status(HttpStatus.OK).json({ status: "success", message: "Image deleted" });
});

// ── PUBLIC ──────────────────────────────────────────────────────────────────────

export const listImages = catchAsync(async (_req: Request, res: Response) => {
  const images = await prisma.galleryImage.findMany({ orderBy: { order: "asc" } });
  return res.status(HttpStatus.OK).json({ status: "success", data: { images } });
});
