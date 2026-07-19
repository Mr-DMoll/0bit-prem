import { randomBytes } from "crypto";
import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError }   from "../../utils/appError.js";
import { AuthService } from "../auth/auth.service.js";
import { getPresignedUploadUrl } from "../../services/s3.service.js";

const authService = new AuthService();

const PROFILE_SELECT = {
  id: true, email: true, role: true, accountStatus: true,
  firstName: true, lastName: true, displayName: true,
  avatarUrl: true, phone: true,
  city: true, country: true, language: true, dateOfBirth: true,
  shippingName: true, shippingPhone: true, shippingLine1: true, shippingLine2: true,
  shippingCity: true, shippingPostalCode: true, shippingCountry: true,
  lastActiveAt: true, createdAt: true,
} as const;

// ── Get profile ────────────────────────────────────────────────────────────────

export const getProfile = catchAsync(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where:  { id: req.user!.userId },
    select: PROFILE_SELECT,
  });
  if (!user) throw new AppError("User not found", HttpStatus.NOT_FOUND);
  return res.status(HttpStatus.OK).json({ status: "success", data: { user } });
});

// ── Update profile ─────────────────────────────────────────────────────────────

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const {
    firstName, lastName, displayName, avatarUrl, phone, city, country, language, dateOfBirth,
    shippingName, shippingPhone, shippingLine1, shippingLine2, shippingCity, shippingPostalCode, shippingCountry,
  } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data:  {
      firstName:   firstName   ?? undefined,
      lastName:    lastName    ?? undefined,
      displayName: displayName ?? undefined,
      avatarUrl:   avatarUrl   ?? undefined,
      phone:       phone       ?? undefined,
      city:        city        ?? undefined,
      country:     country     ?? undefined,
      language:    language    ?? undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      shippingName:       shippingName       ?? undefined,
      shippingPhone:      shippingPhone      ?? undefined,
      shippingLine1:      shippingLine1      ?? undefined,
      shippingLine2:      shippingLine2      ?? undefined,
      shippingCity:       shippingCity       ?? undefined,
      shippingPostalCode: shippingPostalCode ?? undefined,
      shippingCountry:    shippingCountry    ?? undefined,
    },
    select: PROFILE_SELECT,
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: { user } });
});

// ── Avatar upload ───────────────────────────────────────────────────────────────

function sanitizeFilename(filename: string): string {
  return filename.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
}

export const presignAvatar = catchAsync(async (req: Request, res: Response) => {
  const { filename, contentType } = req.body;
  if (!filename) throw new AppError("filename is required", HttpStatus.BAD_REQUEST);
  if (!contentType) throw new AppError("contentType is required", HttpStatus.BAD_REQUEST);

  const key = `avatars/${req.user!.userId}-${randomBytes(6).toString("hex")}-${sanitizeFilename(filename)}`;
  const { uploadUrl, publicUrl } = await getPresignedUploadUrl(key, contentType);

  return res.status(HttpStatus.OK).json({ status: "success", data: { uploadUrl, publicUrl } });
});

// ── Change password ────────────────────────────────────────────────────────────

export const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    throw new AppError("Current and new password are required", HttpStatus.BAD_REQUEST);

  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) throw new AppError("User not found", HttpStatus.NOT_FOUND);

  const match = await authService.verifyPassword(currentPassword, user.password);
  if (!match) throw new AppError("Current password is incorrect", HttpStatus.UNAUTHORIZED);

  const hashed = await authService.hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

  await prisma.auditLog.create({
    data: { userId: user.id, action: "PASSWORD_CHANGED" },
  });
  req.auditLogged = true;

  return res.status(HttpStatus.OK).json({ status: "success", message: "Password changed successfully" });
});