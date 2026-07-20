import { randomBytes } from "crypto";
import os from "os";
import path from "path";
import fs from "fs/promises";
import { Request, Response } from "express";
import multer from "multer";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/appError.js";
import { getPresignedUploadUrl, uploadObject } from "../../services/s3.service.js";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

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

// Tracks come through the server (not a direct-to-R2 presigned PUT) so they can be
// transcoded — admins commonly upload lossless FLAC/WAV masters, which are 3-5x
// larger than a compressed format needs to be for streaming and directly slow down
// playback start time on Sanctum.
export const uploadTrackMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 300 * 1024 * 1024 },
}).single("file");

export const uploadTrack = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError("file is required", HttpStatus.BAD_REQUEST);

  const jobId = randomBytes(8).toString("hex");
  const tmpDir = os.tmpdir();
  const inputExt = path.extname(req.file.originalname) || ".audio";
  const inputPath = path.join(tmpDir, `pk-upload-${jobId}${inputExt}`);
  const outputPath = path.join(tmpDir, `pk-upload-${jobId}.m4a`);

  await fs.writeFile(inputPath, req.file.buffer);

  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .noVideo()
        .audioCodec("aac")
        .audioBitrate("256k")
        .format("mp4")
        .on("error", (err: Error) => reject(err))
        .on("end", () => resolve())
        .save(outputPath);
    });

    const outputBuffer = await fs.readFile(outputPath);
    const baseName = sanitizeFilename(req.file.originalname.replace(/\.[^./]+$/, ""));
    const key = `tracks/${jobId}-${baseName}.m4a`;
    const publicUrl = await uploadObject(key, outputBuffer, "audio/mp4");

    return res.status(HttpStatus.OK).json({ status: "success", data: { publicUrl } });
  } catch (err) {
    console.error("[uploadTrack] transcode failed:", err);
    throw new AppError("Audio transcoding failed", HttpStatus.INTERNAL_SERVER_ERROR);
  } finally {
    await Promise.all([
      fs.unlink(inputPath).catch(() => {}),
      fs.unlink(outputPath).catch(() => {}),
    ]);
  }
});
