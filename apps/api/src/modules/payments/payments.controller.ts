import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";

const SETTING_KEY = "payments_enabled";

interface CacheEntry { value: boolean; expiresAt: number; }
let cache: CacheEntry | null = null;
const TTL_MS = 30_000;

// Real on/off switch for PayFast checkout, backed by the same SystemSetting
// table the existing maintenance-mode toggle uses. Added because the account
// went live before PayFast finished verifying it — without this, every real
// customer's "Buy" click redirected to a PayFast checkout that 403'd, with no
// way to turn it off short of another deploy. Defaults to OFF (missing row =
// disabled) precisely because that's the safe state while verification is
// pending; an admin flips it on from the Payments page once PayFast clears.
export async function isPaymentsEnabled(): Promise<boolean> {
  if (cache && Date.now() < cache.expiresAt) return cache.value;
  try {
    const row = await prisma.systemSetting.findUnique({ where: { key: SETTING_KEY } });
    const value = row?.value === "true";
    cache = { value, expiresAt: Date.now() + TTL_MS };
    return value;
  } catch {
    return false; // DB hiccup: fail closed, not open — never silently let checkout through
  }
}

export const adminGetPaymentsSettings = catchAsync(async (_req: Request, res: Response) => {
  const enabled = await isPaymentsEnabled();
  return res.status(HttpStatus.OK).json({ status: "success", data: { enabled } });
});

export const adminSetPaymentsSettings = catchAsync(async (req: Request, res: Response) => {
  const enabled = req.body.enabled === true;
  await prisma.systemSetting.upsert({
    where: { key: SETTING_KEY },
    update: { value: String(enabled) },
    create: { key: SETTING_KEY, value: String(enabled) },
  });
  cache = { value: enabled, expiresAt: Date.now() + TTL_MS }; // reflect immediately, don't wait out the old cache
  return res.status(HttpStatus.OK).json({ status: "success", data: { enabled } });
});
