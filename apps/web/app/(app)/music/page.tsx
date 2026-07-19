"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PageHeader from "@/features/public/PageHeader";
import { publicMusicService, type PublicAlbum } from "@/features/public/services/music.service";

export default function MusicPage() {
  const [albums, setAlbums]       = useState<PublicAlbum[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    publicMusicService.getAlbums()
      .then((res) => setAlbums(res.data?.albums ?? []))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Music" />
      <p style={{ fontSize: "14px", color: "var(--color-text-muted)", margin: "8px 0 24px" }}>
        Browse albums. Some tracks are free to preview, the rest unlock when you buy the album.
      </p>

      {isLoading ? (
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Loading…</p>
      ) : albums.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>No albums yet — check back soon.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "20px" }}>
          {albums.map((album) => (
            <Link key={album.id} href={`/music/${album.id}`} style={{ textDecoration: "none" }}>
              <div>
                <div style={{
                  aspectRatio: "1",
                  borderRadius: "var(--radius-lg)",
                  background: album.coverImageUrl
                    ? `url(${album.coverImageUrl}) center/cover`
                    : "linear-gradient(135deg, hsl(38,65%,22%), hsl(16,50%,8%))",
                  border: "1px solid var(--color-card-border)",
                  marginBottom: "10px",
                }} />
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)" }}>{album.title}</p>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--color-accent)" }}>
                  {album.currency} {(album.priceCents / 100).toFixed(2)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
