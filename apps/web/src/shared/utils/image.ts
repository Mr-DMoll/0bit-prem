// Routes a remote image through Next's optimizer (/_next/image), which resizes it
// to the width actually displayed and serves AVIF/WebP. Uploaded covers are 2–3 MB
// PNGs; on a 200px thumbnail that's ~99% wasted bytes.
//
// Used as a helper (not <Image>) because most artwork here is a CSS
// `background: url(...) center/cover`, which <Image> can't replace without
// reworking every layout.

// Must stay in sync with images.remotePatterns in next.config.js. A host that
// isn't listed there makes /_next/image return 400 (broken image), so anything
// unrecognised is returned untouched instead.
const OPTIMIZABLE_HOSTS = [/\.r2\.dev$/, /^images\.unsplash\.com$/, /^lh3\.googleusercontent\.com$/];

// /_next/image only accepts widths from Next's default deviceSizes + imageSizes.
const ALLOWED_WIDTHS = [16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840];

function snapWidth(w: number): number {
  return ALLOWED_WIDTHS.find((a) => a >= w) ?? ALLOWED_WIDTHS[ALLOWED_WIDTHS.length - 1];
}

/**
 * @param url    original image URL (may be null/undefined)
 * @param width  CSS width it's displayed at. Pass ~2x for retina-sharp thumbnails.
 */
export function optimizedImage(url: string | null | undefined, width: number): string {
  if (!url) return "";
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== "https:" || !OPTIMIZABLE_HOSTS.some((re) => re.test(hostname))) return url;
  } catch {
    return url;
  }
  return `/_next/image?url=${encodeURIComponent(url)}&w=${snapWidth(width)}&q=75`;
}

/** Same as optimizedImage, but ready to drop into a CSS `background` shorthand. */
export function optimizedBackground(url: string | null | undefined, width: number): string {
  return `url("${optimizedImage(url, width)}") center/cover`;
}
