"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/features/public/PageHeader";
import Lightbox from "@/features/public/Lightbox";
import { publicGalleryService, type PublicGalleryImage } from "@/features/public/services/gallery.service";

export default function GalleryPage() {
  const [images, setImages]       = useState<PublicGalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    publicGalleryService.getImages()
      .then((res) => setImages(res.data?.images ?? []))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Gallery" />

      {isLoading ? (
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Loading…</p>
      ) : images.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>No photos yet — check back soon.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px" }}>
          {images.map((img, i) => (
            <div key={img.id}>
              <button
                onClick={() => setLightboxIndex(i)}
                style={{
                  aspectRatio: "1", width: "100%", padding: 0, cursor: "pointer",
                  borderRadius: "var(--radius-lg)",
                  background: `url(${img.url}) center/cover`,
                  border: "1px solid var(--color-card-border)",
                }}
              />
              {img.caption && (
                <p style={{ margin: "8px 0 0", fontSize: "12px", color: "var(--color-text-muted)" }}>{img.caption}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          images={images.map((img) => ({ url: img.url, caption: img.caption }))}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </div>
  );
}
