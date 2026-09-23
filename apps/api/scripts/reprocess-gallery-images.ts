// One-off maintenance script: re-compresses every existing GalleryImage in place.
//
// Why: admin uploads never downscaled images before this session — some gallery
// photos are 8MB+ camera originals. R2's public dev domain (*.r2.dev) is slow
// enough under load (15-18s for one large file, confirmed) that Next's image
// optimizer's own fetch timeout aborts before the source arrives, producing
// broken images on the Gallery page. New uploads now go through server-side
// compression (see src/services/image.service.ts); this script fixes what's
// already in the bucket.
//
// Safe to re-run: it overwrites each object at its EXISTING key (same URL, so no
// DB writes, no broken references anywhere in the app), and skips any file that's
// already small (< SKIP_BELOW_BYTES) so a second run is a fast no-op.
//
// Usage:  cd apps/api && npx tsx scripts/reprocess-gallery-images.ts [--dry-run]

// Must be imported FIRST: env.config.ts loads the root .env as a module-level side
// effect, and @repo/database reads process.env.DATABASE_URL at ITS OWN module-load
// time — importing it before env.config.ts has run leaves DATABASE_URL unset.
import "../src/config/env.config.js";
import { prisma } from "@repo/database";
import { getObject, uploadObject, keyFromPublicUrl } from "../src/services/s3.service.js";
import { compressImage } from "../src/services/image.service.js";

const SKIP_BELOW_BYTES = 400 * 1024; // already small enough — likely a prior run
const DRY_RUN = process.argv.includes("--dry-run");

function fmt(bytes: number): string {
  return `${(bytes / 1024).toFixed(0)}KB`;
}

async function main() {
  const images = await prisma.galleryImage.findMany({ orderBy: { createdAt: "asc" } });
  console.log(`${images.length} gallery image(s) found.${DRY_RUN ? " (dry run — nothing will be written)" : ""}\n`);

  let fixed = 0, skipped = 0, failed = 0, savedBytes = 0;

  for (const img of images) {
    const key = keyFromPublicUrl(img.url);
    if (!key) {
      console.log(`SKIP  ${img.id}  not an R2 URL: ${img.url}`);
      skipped++;
      continue;
    }

    try {
      const { buffer: original } = await getObject(key);
      if (original.length < SKIP_BELOW_BYTES) {
        console.log(`SKIP  ${key}  already small (${fmt(original.length)})`);
        skipped++;
        continue;
      }

      const { buffer: compressed, contentType } = await compressImage(original);
      const saved = original.length - compressed.length;

      if (compressed.length >= original.length) {
        console.log(`SKIP  ${key}  compression didn't help (${fmt(original.length)} -> ${fmt(compressed.length)})`);
        skipped++;
        continue;
      }

      if (!DRY_RUN) await uploadObject(key, compressed, contentType);

      console.log(`${DRY_RUN ? "WOULD FIX" : "FIXED "} ${key}  ${fmt(original.length)} -> ${fmt(compressed.length)}  (-${Math.round((saved / original.length) * 100)}%)`);
      fixed++;
      savedBytes += saved;
    } catch (err) {
      console.error(`FAIL  ${key}:`, err instanceof Error ? err.message : err);
      failed++;
    }
  }

  console.log(`\n${fixed} fixed, ${skipped} skipped, ${failed} failed. ${savedBytes > 0 ? `Saved ~${(savedBytes / 1024 / 1024).toFixed(1)}MB total.` : ""}`);
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
