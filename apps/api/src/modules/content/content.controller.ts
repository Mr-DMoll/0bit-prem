import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/appError.js";

const ALLOWED_KEYS = ["about_bio", "contact_email", "contact_phone", "contact_socials", "harinam_intro", "sanctum_quote"];

async function getWhitelistedContent() {
  const settings = await prisma.systemSetting.findMany({ where: { key: { in: ALLOWED_KEYS } } });
  const map = Object.fromEntries(ALLOWED_KEYS.map((key) => [key, ""]));
  for (const s of settings) map[s.key] = s.value;
  return map;
}

// ── ADMIN ───────────────────────────────────────────────────────────────────────

export const adminGetContent = catchAsync(async (_req: Request, res: Response) => {
  const content = await getWhitelistedContent();
  return res.status(HttpStatus.OK).json({ status: "success", data: { content } });
});

export const adminUpdateContent = catchAsync(async (req: Request, res: Response) => {
  const { key, value } = req.body;
  if (!ALLOWED_KEYS.includes(key)) throw new AppError("Invalid content key", HttpStatus.BAD_REQUEST);
  if (value === undefined) throw new AppError("Value is required", HttpStatus.BAD_REQUEST);

  const setting = await prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: { setting } });
});

// ── PUBLIC ──────────────────────────────────────────────────────────────────────

export const getContent = catchAsync(async (_req: Request, res: Response) => {
  const content = await getWhitelistedContent();
  return res.status(HttpStatus.OK).json({ status: "success", data: { content } });
});
