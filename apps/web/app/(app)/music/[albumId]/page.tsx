"use client";

import { use, useState, useEffect, useCallback } from "react";
import { Play, Pause, Lock } from "lucide-react";
import PageHeader from "@/features/public/PageHeader";
import { useMusicPlayer } from "@/features/public/MusicPlayerContext";
import { useAuth } from "@/shared/context/AuthContext";
import LockedTrackPrompt from "@/features/public/LockedTrackPrompt";
import { publicMusicService, type PublicAlbum, type PublicTrack } from "@/features/public/services/music.service";

function formatDuration(seconds: number) {
  if (!seconds) return "—";
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function AlbumDetailPage({ params }: { params: Promise<{ albumId: string }> }) {
  const { albumId } = use(params);
  const { user } = useAuth();
  const { nowPlaying, isPlaying, play, toggle } = useMusicPlayer();

  const [album, setAlbum]     = useState<PublicAlbum | null>(null);
  const [tracks, setTracks]   = useState<PublicTrack[]>([]);
  const [isOwned, setIsOwned] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuying, setIsBuying]   = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [lockedTrack, setLockedTrack] = useState<PublicTrack | null>(null);

  const fetchAlbum = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await publicMusicService.getAlbum(albumId);
      setAlbum(res.data?.album ?? null);
      setTracks(res.data?.tracks ?? []);
      setIsOwned(!!res.data?.isOwned);
    } finally {
      setIsLoading(false);
    }
  }, [albumId]);

  useEffect(() => { fetchAlbum(); }, [fetchAlbum]);

  const handlePlay = (track: PublicTrack) => {
    if (track.isLocked || !track.audioUrl) {
      setLockedTrack({ ...track, albumId, albumTitle: album?.title });
      return;
    }
    if (nowPlaying?.track.id === track.id) {
      toggle();
    } else {
      play(track, album?.title ?? "", album?.coverImageUrl ?? null, tracks);
    }
  };

  const handleBuy = async () => {
    if (!user) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
      window.location.href = `${apiBase}/auth/google`;
      return;
    }
    setIsBuying(true); setError(null);
    try {
      await publicMusicService.purchase(albumId);
      await fetchAlbum();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Purchase failed.");
    } finally {
      setIsBuying(false);
    }
  };

  if (isLoading) return <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Loading…</p>;
  if (!album) return <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Album not found.</p>;

  return (
    <div>
      <PageHeader title={album.title} />

      <div style={{ display: "flex", gap: "24px", marginBottom: "28px", flexWrap: "wrap" }}>
        <div style={{
          width: "160px", height: "160px", borderRadius: "var(--radius-lg)", flexShrink: 0,
          background: album.coverImageUrl ? `url(${album.coverImageUrl}) center/cover` : "linear-gradient(135deg, hsl(38,65%,22%), hsl(16,50%,8%))",
          border: "1px solid var(--color-card-border)",
        }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "10px" }}>
          {album.description && (
            <p style={{ margin: 0, fontSize: "14px", color: "var(--color-text-secondary)", maxWidth: "440px" }}>{album.description}</p>
          )}
          {isOwned ? (
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-success)" }}>✓ Owned</span>
          ) : (
            <button onClick={handleBuy} disabled={isBuying} style={{
              alignSelf: "flex-start", padding: "10px 22px",
              background: isBuying ? "var(--color-accent-subtle)" : "var(--color-accent)",
              border: "none", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 700,
              color: "var(--color-accent-text)", cursor: isBuying ? "not-allowed" : "pointer",
            }}>
              {isBuying ? "Processing…" : `Buy Album — ${album.currency} ${(album.priceCents / 100).toFixed(2)}`}
            </button>
          )}
          {error && <p style={{ margin: 0, fontSize: "12px", color: "var(--color-danger)" }}>{error}</p>}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {tracks.map((track) => {
          const isCurrentlyPlaying = nowPlaying?.track.id === track.id && isPlaying;
          return (
            <div key={track.id} style={{
              display: "flex", alignItems: "center", gap: "14px", padding: "12px 4px",
              borderBottom: "1px solid var(--color-border)",
            }}>
              <button
                onClick={() => handlePlay(track)}
                style={{
                  width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0, border: "none",
                  background: track.isLocked ? "var(--color-bg-subtle)" : "var(--color-accent)",
                  color: track.isLocked ? "var(--color-text-muted)" : "var(--color-accent-text)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                {track.isLocked ? <Lock size={12} /> : isCurrentlyPlaying ? <Pause size={12} /> : <Play size={12} style={{ marginLeft: "1px" }} />}
              </button>
              <span style={{
                flex: 1, fontSize: "14px",
                color: track.isLocked ? "var(--color-text-muted)" : "var(--color-text-primary)",
                fontWeight: isCurrentlyPlaying ? 700 : 400,
              }}>
                {track.title}
              </span>
              {track.isFree && !isOwned && (
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Free</span>
              )}
              <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{formatDuration(track.duration)}</span>
            </div>
          );
        })}
      </div>

      {lockedTrack && <LockedTrackPrompt track={lockedTrack} onClose={() => setLockedTrack(null)} onBuy={handleBuy} />}
    </div>
  );
}
