import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import env from "../config/env.config.js";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

// Uploaded objects are content-addressed (random key prefix per upload), so a
// given key's bytes never change — safe to cache aggressively at the edge/browser.
export const R2_CACHE_CONTROL = "public, max-age=31536000, immutable";

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    CacheControl: R2_CACHE_CONTROL,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;

  return { uploadUrl, publicUrl };
}

export async function uploadObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  await s3.send(new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: R2_CACHE_CONTROL,
  }));

  return `${env.R2_PUBLIC_URL}/${key}`;
}

// Reads via the authenticated S3 API endpoint (r2.cloudflarestorage.com), not the
// public `R2_PUBLIC_URL` (*.r2.dev) — that public dev domain is the one that's slow/
// throttled under load (confirmed: 15-18s for a single large file). Used by the
// one-off gallery-image reprocessing script (apps/api/scripts/), which needs to read
// existing objects back before re-compressing and overwriting them.
export async function getObject(key: string): Promise<{ buffer: Buffer; contentType?: string }> {
  const res = await s3.send(new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key }));
  const chunks: Buffer[] = [];
  // @ts-expect-error — Body is a Node Readable at runtime in this SDK's Node target
  for await (const chunk of res.Body) chunks.push(chunk);
  return { buffer: Buffer.concat(chunks), contentType: res.ContentType };
}

/** Extracts the R2 object key from a public URL this app generated (R2_PUBLIC_URL/<key>). */
export function keyFromPublicUrl(url: string): string | null {
  const prefix = `${env.R2_PUBLIC_URL}/`;
  return url.startsWith(prefix) ? url.slice(prefix.length) : null;
}
