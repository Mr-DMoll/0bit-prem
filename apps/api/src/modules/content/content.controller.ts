import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/appError.js";

const ALLOWED_KEYS = [
  "about_bio", "harinam_intro", "sanctum_quote",
  "contact_email", "contact_phone",
  "contact_social_instagram", "contact_social_youtube", "contact_social_facebook",
  "contact_social_x", "contact_social_website",
];

async function getWhitelistedContent() {
  const settings = await prisma.systemSetting.findMany({ where: { key: { in: ALLOWED_KEYS } } });
  const content = Object.fromEntries(ALLOWED_KEYS.map((key) => [key, ""]));
  const meta: Record<string, { updatedAt: string; hasPrevious: boolean }> = {};
  for (const s of settings) {
    content[s.key] = s.value;
    meta[s.key] = { updatedAt: s.updatedAt.toISOString(), hasPrevious: !!s.previousValue };
  }
  return { content, meta };
}

// ── ADMIN ───────────────────────────────────────────────────────────────────────

export const adminGetContent = catchAsync(async (_req: Request, res: Response) => {
  const { content, meta } = await getWhitelistedContent();
  return res.status(HttpStatus.OK).json({ status: "success", data: { content, meta } });
});

export const adminUpdateContent = catchAsync(async (req: Request, res: Response) => {
  const { key, value } = req.body;
  if (!ALLOWED_KEYS.includes(key)) throw new AppError("Invalid content key", HttpStatus.BAD_REQUEST);
  if (value === undefined) throw new AppError("Value is required", HttpStatus.BAD_REQUEST);

  const existing = await prisma.systemSetting.findUnique({ where: { key } });

  const setting = await prisma.systemSetting.upsert({
    where: { key },
    update: { value, previousValue: existing?.value ?? null },
    create: { key, value },
  });

  return res.status(HttpStatus.OK).json({
    status: "success",
    data: { setting, meta: { updatedAt: setting.updatedAt.toISOString(), hasPrevious: !!setting.previousValue } },
  });
});

// Swaps value <-> previousValue — a single-level undo, not full version
// history. Enough to recover from "accidentally overwrote it and saved."
export const adminRevertContent = catchAsync(async (req: Request, res: Response) => {
  const { key } = req.params;
  if (!ALLOWED_KEYS.includes(key)) throw new AppError("Invalid content key", HttpStatus.BAD_REQUEST);

  const existing = await prisma.systemSetting.findUnique({ where: { key } });
  if (!existing?.previousValue) throw new AppError("Nothing to revert to", HttpStatus.BAD_REQUEST);

  const setting = await prisma.systemSetting.update({
    where: { key },
    data: { value: existing.previousValue, previousValue: existing.value },
  });

  return res.status(HttpStatus.OK).json({
    status: "success",
    data: { setting, meta: { updatedAt: setting.updatedAt.toISOString(), hasPrevious: !!setting.previousValue } },
  });
});

// ── PUBLIC ──────────────────────────────────────────────────────────────────────

export const getContent = catchAsync(async (_req: Request, res: Response) => {
  const { content } = await getWhitelistedContent();
  return res.status(HttpStatus.OK).json({ status: "success", data: { content } });
});
