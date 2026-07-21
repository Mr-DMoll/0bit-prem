import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/appError.js";

// ── ADMIN: albums ────────────────────────────────────────────────────────────────

export const adminListAlbums = catchAsync(async (_req: Request, res: Response) => {
  const albums = await prisma.galleryAlbum.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { images: true } } },
  });
  return res.status(HttpStatus.OK).json({ status: "success", data: { albums } });
});

export const adminCreateAlbum = catchAsync(async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name?.trim()) throw new AppError("Album name is required", HttpStatus.BAD_REQUEST);

  const last = await prisma.galleryAlbum.findFirst({ orderBy: { order: "desc" } });
  const album = await prisma.galleryAlbum.create({
    data: { name: name.trim(), order: (last?.order ?? -1) + 1 },
  });

  return res.status(HttpStatus.CREATED).json({ status: "success", data: { album } });
});

export const adminUpdateAlbum = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, order } = req.body;

  const existing = await prisma.galleryAlbum.findUnique({ where: { id } });
  if (!existing) throw new AppError("Album not found", HttpStatus.NOT_FOUND);

  const album = await prisma.galleryAlbum.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(order !== undefined && { order }),
    },
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: { album } });
});

export const adminDeleteAlbum = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.galleryAlbum.findUnique({ where: { id } });
  if (!existing) throw new AppError("Album not found", HttpStatus.NOT_FOUND);

  // Photos aren't deleted — onDelete: SetNull drops them back to Uncategorized.
  await prisma.galleryAlbum.delete({ where: { id } });
  return res.status(HttpStatus.OK).json({ status: "success", message: "Album deleted" });
});

// ── ADMIN: images ────────────────────────────────────────────────────────────────

export const adminListImages = catchAsync(async (req: Request, res: Response) => {
  const albumId = req.query.albumId as string | undefined;
  const where = albumId ? { albumId: albumId === "none" ? null : albumId } : {};

  const images = await prisma.galleryImage.findMany({
    where,
    orderBy: { order: "asc" },
    include: { album: { select: { id: true, name: true } } },
  });
  return res.status(HttpStatus.OK).json({ status: "success", data: { images } });
});

export const adminCreateImage = catchAsync(async (req: Request, res: Response) => {
  const { url, caption, albumId } = req.body;
  if (!url) throw new AppError("Image URL is required", HttpStatus.BAD_REQUEST);

  const last = await prisma.galleryImage.findFirst({ orderBy: { order: "desc" } });
  const nextOrder = (last?.order ?? -1) + 1;

  const image = await prisma.galleryImage.create({
    data: { url, caption: caption ?? null, albumId: albumId ?? null, order: nextOrder },
  });

  return res.status(HttpStatus.CREATED).json({ status: "success", data: { image } });
});

// Bulk-create for the drag-and-drop multi-file upload flow — each file is
// uploaded to R2 client-side first (existing presign flow), then all the
// resulting URLs are turned into GalleryImage rows in a single call.
export const adminBulkCreateImages = catchAsync(async (req: Request, res: Response) => {
  const { images } = req.body;
  if (!Array.isArray(images) || images.length === 0)
    throw new AppError("At least one image is required", HttpStatus.BAD_REQUEST);

  const last = await prisma.galleryImage.findFirst({ orderBy: { order: "desc" } });
  let nextOrder = (last?.order ?? -1) + 1;

  const created = await prisma.$transaction(
    images.map((img: { url: string; caption?: string; albumId?: string | null }) =>
      prisma.galleryImage.create({
        data: {
          url: img.url,
          caption: img.caption ?? null,
          albumId: img.albumId ?? null,
          order: nextOrder++,
        },
      })
    )
  );

  return res.status(HttpStatus.CREATED).json({ status: "success", data: { images: created } });
});

export const adminUpdateImage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { caption, albumId } = req.body;

  const image = await prisma.galleryImage.findUnique({ where: { id } });
  if (!image) throw new AppError("Image not found", HttpStatus.NOT_FOUND);

  const updated = await prisma.galleryImage.update({
    where: { id },
    data: {
      ...(caption !== undefined && { caption }),
      ...(albumId !== undefined && { albumId: albumId || null }),
    },
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: { image: updated } });
});

// Native drag-to-reorder — replaces the old one-at-a-time up/down swap.
// `order` is the full list of image IDs in their new order (within whatever
// filtered view — All Photos or a single album — the admin was reordering).
export const adminReorderImages = catchAsync(async (req: Request, res: Response) => {
  const { order } = req.body;
  if (!Array.isArray(order) || order.length === 0)
    throw new AppError("order must be a non-empty array of image IDs", HttpStatus.BAD_REQUEST);

  await prisma.$transaction(
    order.map((id: string, index: number) =>
      prisma.galleryImage.update({ where: { id }, data: { order: index } })
    )
  );

  return res.status(HttpStatus.OK).json({ status: "success" });
});

export const adminBulkMoveImages = catchAsync(async (req: Request, res: Response) => {
  const { ids, albumId } = req.body;
  if (!Array.isArray(ids) || ids.length === 0)
    throw new AppError("ids must be a non-empty array", HttpStatus.BAD_REQUEST);

  await prisma.galleryImage.updateMany({
    where: { id: { in: ids } },
    data: { albumId: albumId || null },
  });

  return res.status(HttpStatus.OK).json({ status: "success" });
});

export const adminBulkDeleteImages = catchAsync(async (req: Request, res: Response) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0)
    throw new AppError("ids must be a non-empty array", HttpStatus.BAD_REQUEST);

  await prisma.galleryImage.deleteMany({ where: { id: { in: ids } } });
  return res.status(HttpStatus.OK).json({ status: "success" });
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
  const [images, albums] = await Promise.all([
    prisma.galleryImage.findMany({
      orderBy: { order: "asc" },
      include: { album: { select: { id: true, name: true } } },
    }),
    prisma.galleryAlbum.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { images: true } } },
    }),
  ]);
  return res.status(HttpStatus.OK).json({ status: "success", data: { images, albums } });
});
