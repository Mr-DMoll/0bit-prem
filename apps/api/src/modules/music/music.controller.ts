import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus, Role } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/appError.js";
import { slugify } from "../../utils/slugify.js";

const STAFF_ROLES = [Role.ADMIN, Role.SUPER_ADMIN, Role.MANAGER];

// ── ADMIN: albums ──────────────────────────────────────────────────────────────

export const adminListAlbums = catchAsync(async (_req: Request, res: Response) => {
  const albums = await prisma.album.findMany({
    orderBy: { createdAt: "desc" },
    include: { tracks: { orderBy: { order: "asc" } } },
  });
  return res.status(HttpStatus.OK).json({ status: "success", data: { albums } });
});

export const adminCreateAlbum = catchAsync(async (req: Request, res: Response) => {
  const { title, description, coverImageUrl, priceCents, currency, releaseDate } = req.body;
  if (!title) throw new AppError("Title is required", HttpStatus.BAD_REQUEST);
  if (typeof priceCents !== "number" || priceCents < 0)
    throw new AppError("priceCents must be a non-negative number", HttpStatus.BAD_REQUEST);

  const album = await prisma.album.create({
    data: {
      title,
      slug: slugify(title),
      description: description ?? null,
      coverImageUrl: coverImageUrl ?? null,
      priceCents,
      currency: currency ?? "ZAR",
      releaseDate: releaseDate ? new Date(releaseDate) : null,
      status: "DRAFT",
    },
  });

  return res.status(HttpStatus.CREATED).json({ status: "success", data: { album } });
});

export const adminGetAlbum = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const album = await prisma.album.findUnique({
    where: { id },
    include: { tracks: { orderBy: { order: "asc" } } },
  });
  if (!album) throw new AppError("Album not found", HttpStatus.NOT_FOUND);
  return res.status(HttpStatus.OK).json({ status: "success", data: { album } });
});

export const adminUpdateAlbum = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, coverImageUrl, priceCents, currency, releaseDate, status } = req.body;

  const existing = await prisma.album.findUnique({ where: { id } });
  if (!existing) throw new AppError("Album not found", HttpStatus.NOT_FOUND);

  if (status && !["DRAFT", "LIVE", "ARCHIVED"].includes(status))
    throw new AppError("Invalid status value", HttpStatus.BAD_REQUEST);

  const album = await prisma.album.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(coverImageUrl !== undefined && { coverImageUrl }),
      ...(priceCents !== undefined && { priceCents }),
      ...(currency !== undefined && { currency }),
      ...(releaseDate !== undefined && { releaseDate: releaseDate ? new Date(releaseDate) : null }),
      ...(status !== undefined && { status }),
    },
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: { album } });
});

export const adminDeleteAlbum = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.album.findUnique({ where: { id } });
  if (!existing) throw new AppError("Album not found", HttpStatus.NOT_FOUND);

  const purchaseCount = await prisma.albumPurchase.count({ where: { albumId: id } });
  if (purchaseCount > 0) {
    throw new AppError(
      `This album has been purchased by ${purchaseCount} customer${purchaseCount === 1 ? "" : "s"} and can't be deleted — archive it instead to hide it from new customers while keeping their purchase history intact.`,
      HttpStatus.CONFLICT
    );
  }

  await prisma.album.delete({ where: { id } });
  return res.status(HttpStatus.OK).json({ status: "success", message: "Album deleted" });
});

// ── ADMIN: tracks ──────────────────────────────────────────────────────────────

export const adminCreateTrack = catchAsync(async (req: Request, res: Response) => {
  const { id: albumId } = req.params;
  const { title, audioUrl, isFree, duration } = req.body;

  const album = await prisma.album.findUnique({ where: { id: albumId } });
  if (!album) throw new AppError("Album not found", HttpStatus.NOT_FOUND);
  if (!title) throw new AppError("Title is required", HttpStatus.BAD_REQUEST);
  if (!audioUrl) throw new AppError("audioUrl is required", HttpStatus.BAD_REQUEST);

  const last = await prisma.track.findFirst({ where: { albumId }, orderBy: { order: "desc" } });
  const nextOrder = (last?.order ?? -1) + 1;

  const track = await prisma.track.create({
    data: {
      title,
      audioUrl,
      isFree: !!isFree,
      duration: duration ?? 0,
      order: nextOrder,
      albumId,
    },
  });

  return res.status(HttpStatus.CREATED).json({ status: "success", data: { track } });
});

export const adminCreateTracksBatch = catchAsync(async (req: Request, res: Response) => {
  const { id: albumId } = req.params;
  const { tracks } = req.body;

  const album = await prisma.album.findUnique({ where: { id: albumId } });
  if (!album) throw new AppError("Album not found", HttpStatus.NOT_FOUND);
  if (!Array.isArray(tracks) || tracks.length === 0)
    throw new AppError("tracks must be a non-empty array", HttpStatus.BAD_REQUEST);
  for (const t of tracks) {
    if (!t.title) throw new AppError("Each track requires a title", HttpStatus.BAD_REQUEST);
    if (!t.audioUrl) throw new AppError("Each track requires an audioUrl", HttpStatus.BAD_REQUEST);
  }

  const last = await prisma.track.findFirst({ where: { albumId }, orderBy: { order: "desc" } });
  let nextOrder = (last?.order ?? -1) + 1;

  const created = await prisma.$transaction(
    tracks.map((t: { title: string; audioUrl: string; isFree?: boolean; duration?: number }) =>
      prisma.track.create({
        data: {
          title: t.title,
          audioUrl: t.audioUrl,
          isFree: !!t.isFree,
          duration: t.duration ?? 0,
          order: nextOrder++,
          albumId,
        },
      })
    )
  );

  return res.status(HttpStatus.CREATED).json({ status: "success", data: { tracks: created } });
});

export const adminBulkUpdateTracks = catchAsync(async (req: Request, res: Response) => {
  const { id: albumId } = req.params;
  const { updates, deletes } = req.body;

  const album = await prisma.album.findUnique({ where: { id: albumId } });
  if (!album) throw new AppError("Album not found", HttpStatus.NOT_FOUND);

  const ops = [
    ...((Array.isArray(updates) ? updates : []) as { id: string; title?: string; isFree?: boolean; order?: number }[]).map((u) =>
      prisma.track.update({
        where: { id: u.id },
        data: {
          ...(u.title !== undefined && { title: u.title }),
          ...(u.isFree !== undefined && { isFree: !!u.isFree }),
          ...(u.order !== undefined && { order: u.order }),
        },
      })
    ),
    ...((Array.isArray(deletes) ? deletes : []) as string[]).map((id) =>
      prisma.track.delete({ where: { id } })
    ),
  ];

  if (ops.length === 0) throw new AppError("No updates or deletes provided", HttpStatus.BAD_REQUEST);

  await prisma.$transaction(ops);

  const tracks = await prisma.track.findMany({ where: { albumId }, orderBy: { order: "asc" } });
  return res.status(HttpStatus.OK).json({ status: "success", data: { tracks } });
});

export const adminUpdateTrack = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, audioUrl, isFree, duration, swapWithOrder } = req.body;

  const track = await prisma.track.findUnique({ where: { id } });
  if (!track) throw new AppError("Track not found", HttpStatus.NOT_FOUND);

  if (swapWithOrder !== undefined) {
    // Simple up/down reorder: swap this track's order with whatever track
    // currently holds swapWithOrder in the same album.
    const other = await prisma.track.findFirst({ where: { albumId: track.albumId, order: swapWithOrder } });
    if (other) {
      await prisma.$transaction([
        prisma.track.update({ where: { id: track.id }, data: { order: swapWithOrder } }),
        prisma.track.update({ where: { id: other.id }, data: { order: track.order } }),
      ]);
    }
  }

  const updated = await prisma.track.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(audioUrl !== undefined && { audioUrl }),
      ...(isFree !== undefined && { isFree: !!isFree }),
      ...(duration !== undefined && { duration }),
    },
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: { track: updated } });
});

export const adminDeleteTrack = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const track = await prisma.track.findUnique({ where: { id } });
  if (!track) throw new AppError("Track not found", HttpStatus.NOT_FOUND);

  await prisma.track.delete({ where: { id } });
  return res.status(HttpStatus.OK).json({ status: "success", message: "Track deleted" });
});

// ── PUBLIC: browse ─────────────────────────────────────────────────────────────

export const listAlbums = catchAsync(async (_req: Request, res: Response) => {
  const albums = await prisma.album.findMany({
    where: { status: "LIVE" },
    orderBy: { releaseDate: "desc" },
  });
  return res.status(HttpStatus.OK).json({ status: "success", data: { albums } });
});

export const getAlbum = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const album = await prisma.album.findUnique({
    where: { id },
    include: { tracks: { orderBy: { order: "asc" } } },
  });
  if (!album || album.status !== "LIVE")
    throw new AppError("Album not found", HttpStatus.NOT_FOUND);

  const user = req.user ?? null;
  const isStaff = !!user && STAFF_ROLES.includes(user.role as Role);

  let isOwned = false;
  if (user && !isStaff) {
    const purchase = await prisma.albumPurchase.findUnique({
      where: { userId_albumId: { userId: user.userId, albumId: album.id } },
    });
    isOwned = !!purchase;
  }

  const unlocked = isStaff || isOwned;

  const tracks = album.tracks.map((track) => {
    const accessible = track.isFree || unlocked;
    return {
      id: track.id,
      title: track.title,
      order: track.order,
      duration: track.duration,
      isFree: track.isFree,
      isLocked: !accessible,
      audioUrl: accessible ? track.audioUrl : null,
    };
  });

  return res.status(HttpStatus.OK).json({
    status: "success",
    data: {
      album: {
        id: album.id, title: album.title, slug: album.slug, description: album.description,
        coverImageUrl: album.coverImageUrl, priceCents: album.priceCents, currency: album.currency,
        releaseDate: album.releaseDate,
      },
      tracks,
      isOwned: unlocked,
    },
  });
});

export const purchaseAlbum = catchAsync(async (req: Request, res: Response) => {
  const { id: albumId } = req.params;
  const userId = req.user!.userId;

  const album = await prisma.album.findUnique({ where: { id: albumId } });
  if (!album || album.status !== "LIVE") throw new AppError("Album not found", HttpStatus.NOT_FOUND);

  const existing = await prisma.albumPurchase.findUnique({
    where: { userId_albumId: { userId, albumId } },
  });
  if (existing) throw new AppError("You already own this album", HttpStatus.CONFLICT);

  const [purchase] = await prisma.$transaction(async (tx) => {
    const purchase = await tx.albumPurchase.create({
      data: {
        userId,
        albumId,
        priceCents: album.priceCents,
        currency: album.currency,
      },
    });
    await tx.paymentTransaction.create({
      data: {
        userId,
        purpose: "ALBUM_PURCHASE",
        referenceId: purchase.id,
        mPaymentId: `album_${purchase.id}`,
        amountCents: album.priceCents,
        currency: album.currency,
        status: "COMPLETE",
      },
    });
    return [purchase];
  });

  return res.status(HttpStatus.CREATED).json({ status: "success", data: { purchase } });
});

// ── PUBLIC: my albums ───────────────────────────────────────────────────────────

export const getMyAlbums = catchAsync(async (req: Request, res: Response) => {
  const purchases = await prisma.albumPurchase.findMany({
    where: { userId: req.user!.userId },
    include: { album: true },
    orderBy: { purchasedAt: "desc" },
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: { purchases } });
});

// ── PUBLIC: Sanctum mix ─────────────────────────────────────────────────────────
// Home-screen rotation: the full live catalog, every time — free tracks and
// tracks from albums the listener owns play directly; everything else shows
// up locked (title visible, no audioUrl) so browsing itself sells the album,
// instead of only ever surfacing the free sampler.

export const getSanctumMix = catchAsync(async (req: Request, res: Response) => {
  const user = req.user ?? null;
  const isStaff = !!user && STAFF_ROLES.includes(user.role as Role);

  let ownedAlbumIds = new Set<string>();
  if (user && !isStaff) {
    const purchases = await prisma.albumPurchase.findMany({
      where: { userId: user.userId },
      select: { albumId: true },
    });
    ownedAlbumIds = new Set(purchases.map((p) => p.albumId));
  }

  const albums = await prisma.album.findMany({
    where: { status: "LIVE" },
    include: { tracks: { orderBy: { order: "asc" } } },
    orderBy: { releaseDate: "desc" },
  });

  const tracks = albums.flatMap((album) => {
    const unlocked = isStaff || ownedAlbumIds.has(album.id);
    return album.tracks.map((track) => {
      const accessible = track.isFree || unlocked;
      return {
        id: track.id,
        title: track.title,
        order: track.order,
        duration: track.duration,
        isFree: track.isFree,
        isLocked: !accessible,
        audioUrl: accessible ? track.audioUrl : null,
        albumId: album.id,
        albumTitle: album.title,
        albumCoverUrl: album.coverImageUrl,
      };
    });
  });

  const mode = ownedAlbumIds.size > 0 ? "owned" : "sampler";
  return res.status(HttpStatus.OK).json({ status: "success", data: { mode, tracks } });
});
