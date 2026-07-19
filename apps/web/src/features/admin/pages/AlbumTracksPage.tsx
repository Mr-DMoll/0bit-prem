"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { musicService, type Album } from "../services/music.service";
import { TrackStudio } from "../components/TrackStudio";

export function AlbumTracksPage({ albumId }: { albumId: string }) {
  const [album, setAlbum]         = useState<Album | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const fetchAlbum = useCallback(async () => {
    try {
      setIsLoading(true); setError(null);
      const res = await musicService.getAlbum(albumId);
      setAlbum(res.data?.album ?? null);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load album.");
    } finally {
      setIsLoading(false);
    }
  }, [albumId]);

  useEffect(() => { fetchAlbum(); }, [fetchAlbum]);

  if (isLoading) return <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading…</div>;
  if (error || !album) return <div style={{ padding: "60px", textAlign: "center", color: "var(--color-danger)" }}>{error ?? "Album not found."}</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <Link href="/admin/music" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--color-text-muted)", textDecoration: "none", marginBottom: "8px" }}>
          <ArrowLeft size={14} /> Back to Music
        </Link>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>{album.title}</h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>Manage tracks</p>
      </div>

      <TrackStudio albumId={album.id} tracks={album.tracks ?? []} onTracksChange={fetchAlbum} />
    </div>
  );
}
