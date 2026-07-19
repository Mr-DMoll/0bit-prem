import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/appError.js";

// ── Claim device — called when playback starts, kicks out any other device ────
export const claimDevice = catchAsync(async (req: Request, res: Response) => {
  const { deviceId } = req.body;
  if (!deviceId) throw new AppError("deviceId is required", HttpStatus.BAD_REQUEST);

  await prisma.user.update({
    where: { id: req.user!.userId },
    data: { activeDeviceId: deviceId },
  });

  return res.status(HttpStatus.OK).json({ status: "success" });
});

// ── Check device — polled while playing, tells the client if it's been kicked ─
export const checkDevice = catchAsync(async (req: Request, res: Response) => {
  const { deviceId } = req.body;
  if (!deviceId) throw new AppError("deviceId is required", HttpStatus.BAD_REQUEST);

  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { activeDeviceId: true },
  });

  return res.status(HttpStatus.OK).json({
    status: "success",
    data: { active: user?.activeDeviceId === deviceId },
  });
});
