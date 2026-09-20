/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Uploaded covers/photos are multi-megabyte originals; the optimizer resizes
    // them to the size actually shown and serves AVIF/WebP instead.
    formats: ["image/avif", "image/webp"],
    // Uploaded files have unique, immutable names, so a long cache is safe.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
