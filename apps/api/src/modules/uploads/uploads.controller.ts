import { randomBytes } from "crypto";
import { Request, Response } from "express";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/appError.js";
import { getPresignedUploadUrl } from "../../services/s3.service.js";

const ALLOWED_FOLDERS = ["albums", "tracks", "events", "gallery", "products"];

function sanitizeFilename(filename: string): string {
  return filename.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
}

export const presignUpload = catchAsync(async (req: Request, res: Response) => {
  const { filename, contentType, folder } = req.body;

  if (!filename) throw new AppError("filename is required", HttpStatus.BAD_REQUEST);
  if (!contentType) throw new AppError("contentType is required", HttpStatus.BAD_REQUEST);
  if (!ALLOWED_FOLDERS.includes(folder)) throw new AppError("Invalid folder", HttpStatus.BAD_REQUEST);

  const key = `${folder}/${randomBytes(8).toString("hex")}-${sanitizeFilename(filename)}`;
  const { uploadUrl, publicUrl } = await getPresignedUploadUrl(key, contentType);

  return res.status(HttpStatus.OK).json({ status: "success", data: { uploadUrl, publicUrl } });
});
