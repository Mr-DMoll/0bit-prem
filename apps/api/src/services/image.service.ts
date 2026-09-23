import sharp from "sharp";

// Admin-uploaded images (camera photos, AI-generated cover art) routinely arrive
// as multi-megabyte originals — 8MB+ JPEGs at 4000px+, 2-3MB PNGs shown as thumbnails.
// Nothing ever downscaled them before they landed in R2, so every request for a
// resized variant (via Next's image optimizer) had to fetch the full original from
// R2's public dev domain first — slow enough under load to intermittently time out
// (confirmed: an 8MB file took 15-18s to serve, longer than the optimizer's own
// fetch timeout, producing broken images on the Gallery page). Compressing on the
// way in fixes both the storage bloat and the slow-origin-fetch timeout at once.
const MAX_DIMENSION = 2000; // no page on the site ever displays an image larger than this
const JPEG_QUALITY = 82;
const WEBP_QUALITY = 82;

export interface CompressedImage {
  buffer: Buffer;
  contentType: string;
  extension: string;
}

/**
 * Downscales (never upscales) to MAX_DIMENSION on the long edge and re-encodes.
 * Images with real transparency become WebP (keeps the alpha channel, still far
 * smaller than PNG); everything else becomes JPEG. Both formats are read fine by
 * Next's image optimizer and by <img>/background-image directly, regardless of
 * the original file's extension.
 */
export async function compressImage(input: Buffer): Promise<CompressedImage> {
  const image = sharp(input, { failOn: "none" });
  const metadata = await image.metadata();

  const resized = image.resize({
    width: MAX_DIMENSION,
    height: MAX_DIMENSION,
    fit: "inside",
    withoutEnlargement: true,
  });

  // A PNG with an alpha channel that's actually opaque everywhere (common for
  // flattened AI-generated art) doesn't need to pay WebP-with-alpha's cost —
  // .stats() reports whether the alpha channel's min/max differ, i.e. is it
  // doing anything.
  let hasRealAlpha = false;
  if (metadata.hasAlpha) {
    const stats = await sharp(input).stats();
    const alphaChannel = stats.channels[stats.channels.length - 1];
    hasRealAlpha = alphaChannel.min !== alphaChannel.max;
  }

  if (hasRealAlpha) {
    const buffer = await resized.webp({ quality: WEBP_QUALITY }).toBuffer();
    return { buffer, contentType: "image/webp", extension: "webp" };
  }

  const buffer = await resized.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
  return { buffer, contentType: "image/jpeg", extension: "jpg" };
}
