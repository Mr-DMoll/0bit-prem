"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/features/public/PageHeader";
import Lightbox from "@/features/public/Lightbox";
import { publicGalleryService, type PublicGalleryImage, type PublicGalleryAlbum } from "@/features/public/services/gallery.service";

export default function GalleryPage() {
  const [images, setImages]       = useState<PublicGalleryImage[]>([]);
  const [albums, setAlbums]       = useState<PublicGalleryAlbum[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter]       = useState<string>("ALL");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    publicGalleryService.getImages()
      .then((res) => {
        setImages(res.data?.images ?? []);
        setAlbums(res.data?.albums ?? []);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const visibleImages = filter === "ALL" ? images : images.filter((img) => img.albumId === filter);

  const filterPills = albums.length > 0 && (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", padding: "16px 0" }}>
      {[{ id: "ALL", name: "All" }, ...albums].map((a) => (
        <button
          key={a.id}
          onClick={() => setFilter(a.id)}
          style={{
            padding: "7px 16px", borderRadius: "var(--radius-pill)",
            fontSize: "12.5px", fontWeight: 600, cursor: "pointer",
            border: filter === a.id ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
            background: filter === a.id ? "var(--color-accent-subtle)" : "var(--color-bg-subtle)",
            color: filter === a.id ? "var(--color-accent)" : "var(--color-text-secondary)",
          }}
        >
          {a.name}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <PageHeader title="Gallery" tabs={filterPills || undefined} />

      {isLoading ? (
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Loading…</p>
      ) : visibleImages.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>No photos yet — check back soon.</p>
      ) : (
        <div style={{ columnWidth: "220px", columnGap: "16px" }}>
          {visibleImages.map((img, i) => (
            <div key={img.id} style={{ breakInside: "avoid", marginBottom: "16px" }}>
              <button
                onClick={() => setLightboxIndex(i)}
                style={{
                  width: "100%", padding: 0, cursor: "pointer", display: "block",
                  borderRadius: "var(--radius-lg)", overflow: "hidden",
                  border: "1px solid var(--color-card-border)", background: "none",
                }}
              >
                <img
                  src={img.url}
                  alt={img.caption || "Premvkay gallery photo"}
                  loading="lazy"
                  style={{ width: "100%", display: "block" }}
                />
              </button>
              {img.caption && (
                <p style={{ margin: "8px 0 0", fontSize: "12px", color: "var(--color-text-muted)" }}>{img.caption}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          images={visibleImages.map((img) => ({ url: img.url, caption: img.caption }))}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </div>
  );
}
