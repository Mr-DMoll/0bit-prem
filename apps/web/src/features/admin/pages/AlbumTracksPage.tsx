"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUp, ArrowDown, Plus, Trash2 } from "lucide-react";
import { musicService, type Album, type Track, type TrackInput } from "../services/music.service";
import { FileUploadField } from "../components/FileUploadField";

const inputStyle: React.CSSProperties = {
  padding: "9px 12px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)", fontSize: "13.5px", color: "var(--color-text-primary)",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};

function AddTrackRow({ onSubmit }: { onSubmit: (input: TrackInput) => Promise<void> }) {
  const [title, setTitle]       = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [isFree, setIsFree]     = useState(false);
  const [busy, setBusy]         = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !audioUrl.trim()) return;
    setBusy(true);
    try {
      await onSubmit({ title: title.trim(), audioUrl: audioUrl.trim(), isFree, duration: duration ? parseInt(duration) : 0 });
      setTitle(""); setAudioUrl(""); setDuration(""); setIsFree(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{
      display: "flex", flexDirection: "column", gap: "12px",
      padding: "16px 20px", background: "var(--color-bg-subtle)",
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "12px", alignItems: "start" }}>
        <input style={{ ...inputStyle, alignSelf: "center" }} placeholder="Track title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <FileUploadField value={audioUrl} onChange={setAudioUrl} accept="audio/*" folder="tracks" />
      </div>
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <input style={{ ...inputStyle, width: "90px" }} placeholder="Sec" type="number" min="0" value={duration} onChange={(e) => setDuration(e.target.value)} />
        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--color-text-secondary)" }}>
          <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} /> Free
        </label>
        <button type="submit" disabled={busy || !audioUrl} style={{
          padding: "9px 14px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)",
          fontSize: "12.5px", fontWeight: 600, color: "var(--color-accent-text)", cursor: (busy || !audioUrl) ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
        }}>
          <Plus size={13} /> Add
        </button>
      </div>
    </form>
  );
}

function TrackRow({ track, isFirst, isLast, onReorder, onToggleFree, onDelete }: {
  track: Track; isFirst: boolean; isLast: boolean;
  onReorder: (id: string, direction: "up" | "down") => Promise<void>;
  onToggleFree: (id: string, isFree: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
      <td style={{ padding: "12px 20px", width: "70px" }}>
        <div style={{ display: "flex", gap: "4px" }}>
          <button disabled={isFirst} onClick={() => onReorder(track.id, "up")} style={{
            background: "none", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)",
            cursor: isFirst ? "not-allowed" : "pointer", opacity: isFirst ? 0.4 : 1, padding: "3px",
          }}>
            <ArrowUp size={13} />
          </button>
          <button disabled={isLast} onClick={() => onReorder(track.id, "down")} style={{
            background: "none", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)",
            cursor: isLast ? "not-allowed" : "pointer", opacity: isLast ? 0.4 : 1, padding: "3px",
          }}>
            <ArrowDown size={13} />
          </button>
        </div>
      </td>
      <td style={{ padding: "12px 20px", fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-primary)" }}>{track.title}</td>
      <td style={{ padding: "12px 20px", fontSize: "13px", color: "var(--color-text-muted)" }}>
        {track.duration ? `${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, "0")}` : "—"}
      </td>
      <td style={{ padding: "12px 20px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--color-text-secondary)", cursor: "pointer" }}>
          <input type="checkbox" checked={track.isFree} onChange={(e) => onToggleFree(track.id, e.target.checked)} /> Free preview
        </label>
      </td>
      <td style={{ padding: "12px 20px" }}>
        <button onClick={() => onDelete(track.id)} style={{
          background: "var(--color-danger-subtle)", border: "1px solid var(--color-danger-subtle)", borderRadius: "var(--radius-md)",
          color: "var(--color-danger)", cursor: "pointer", padding: "5px 10px", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px",
        }}>
          <Trash2 size={12} /> Delete
        </button>
      </td>
    </tr>
  );
}

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

  const tracks = (album?.tracks ?? []).slice().sort((a, b) => a.order - b.order);

  const handleAdd = async (input: TrackInput) => { await musicService.createTrack(albumId, input); await fetchAlbum(); };
  const handleToggleFree = async (id: string, isFree: boolean) => { await musicService.updateTrack(id, { isFree }); await fetchAlbum(); };
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this track?")) return;
    await musicService.deleteTrack(id);
    await fetchAlbum();
  };
  const handleReorder = async (id: string, direction: "up" | "down") => {
    const idx = tracks.findIndex((t) => t.id === id);
    const swapWithOrder = direction === "up" ? tracks[idx - 1]?.order : tracks[idx + 1]?.order;
    if (swapWithOrder === undefined) return;
    await musicService.updateTrack(id, { swapWithOrder });
    await fetchAlbum();
  };

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

      <div style={{ background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-xl)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        {tracks.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13.5px" }}>No tracks yet — add one below.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["", "Title", "Duration", "Access", ""].map((h, i) => (
                  <th key={i} style={{ padding: "10px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", background: "var(--color-bg-subtle)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tracks.map((track, i) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  isFirst={i === 0}
                  isLast={i === tracks.length - 1}
                  onReorder={handleReorder}
                  onToggleFree={handleToggleFree}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        )}
        <AddTrackRow onSubmit={handleAdd} />
      </div>
    </div>
  );
}
