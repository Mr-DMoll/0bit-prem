"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, ListMusic } from "lucide-react";
import { musicService, type Album, type AlbumInput } from "../services/music.service";
import { FileUploadField } from "../components/FileUploadField";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px",
  background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)", fontSize: "14px", color: "var(--color-text-primary)",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)",
  marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em",
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    LIVE:     { background: "var(--color-success-subtle)", color: "var(--color-success)" },
    DRAFT:    { background: "var(--color-warning-subtle)", color: "var(--color-warning)" },
    ARCHIVED: { background: "var(--color-bg-subtle)",      color: "var(--color-text-muted)" },
  };
  return (
    <span style={{
      ...(styles[status] ?? styles.DRAFT),
      display: "inline-flex", padding: "3px 10px", borderRadius: "var(--radius-pill)",
      fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
    }}>
      {status}
    </span>
  );
}

function AlbumModal({ album, onClose, onSubmit }: {
  album: Album | null;
  onClose: () => void;
  onSubmit: (input: AlbumInput) => Promise<void>;
}) {
  const [title, setTitle]                 = useState(album?.title ?? "");
  const [description, setDescription]     = useState(album?.description ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(album?.coverImageUrl ?? "");
  const [price, setPrice]                 = useState(album ? (album.priceCents / 100).toFixed(2) : "");
  const [releaseDate, setReleaseDate]     = useState(album?.releaseDate?.slice(0, 10) ?? "");
  const [status, setStatus]               = useState(album?.status ?? "DRAFT");
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price) return;
    setIsSubmitting(true); setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        coverImageUrl: coverImageUrl.trim() || undefined,
        priceCents: Math.round(parseFloat(price) * 100),
        releaseDate: releaseDate || undefined,
        status,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to save album.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{
        position: "relative", zIndex: 10, width: "100%", maxWidth: "480px",
        background: "var(--color-card-bg)", border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)", padding: "32px", boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
            {album ? "Edit Album" : "New Album"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", fontSize: "18px" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Title</label>
            <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "70px" }} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <FileUploadField
            label="Cover image"
            value={coverImageUrl}
            onChange={setCoverImageUrl}
            accept="image/*"
            folder="albums"
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={labelStyle}>Price (ZAR)</label>
              <input style={inputStyle} type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Release date</label>
              <input style={inputStyle} type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} />
            </div>
          </div>
          {album && (
            <div>
              <label style={labelStyle}>Status</label>
              <select style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value as Album["status"])}>
                <option value="DRAFT">Draft</option>
                <option value="LIVE">Live</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          )}

          {error && (
            <div style={{ padding: "10px 14px", background: "var(--color-danger-subtle)", border: "1px solid var(--color-danger)", borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--color-danger)" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: "10px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)", fontSize: "14px", color: "var(--color-text-secondary)", cursor: "pointer",
            }}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} style={{
              flex: 1, padding: "10px",
              background: isSubmitting ? "var(--color-accent-subtle)" : "var(--color-accent)",
              border: "none", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 600,
              color: isSubmitting ? "var(--color-accent)" : "var(--color-accent-text)",
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}>
              {isSubmitting ? "Saving…" : album ? "Save changes" : "Create album"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function MusicPage() {
  const [albums, setAlbums]       = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [modalAlbum, setModalAlbum] = useState<Album | null | "new">(null);

  const fetchAlbums = useCallback(async () => {
    try {
      setIsLoading(true); setError(null);
      const res = await musicService.getAlbums();
      setAlbums(res.data?.albums ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load albums.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlbums(); }, [fetchAlbums]);

  const handleCreate = async (input: AlbumInput) => { await musicService.createAlbum(input); await fetchAlbums(); };
  const handleUpdate = async (id: string, input: AlbumInput) => { await musicService.updateAlbum(id, input); await fetchAlbums(); };
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this album and all its tracks?")) return;
    await musicService.deleteAlbum(id);
    await fetchAlbums();
  };

  const live = albums.filter((a) => a.status === "LIVE").length;
  const draft = albums.filter((a) => a.status === "DRAFT").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>Music</h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>Albums and tracks</p>
        </div>
        <button onClick={() => setModalAlbum("new")} style={{
          display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px",
          background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)",
          fontSize: "13.5px", fontWeight: 600, color: "var(--color-accent-text)", cursor: "pointer",
        }}>
          <Plus size={15} /> New Album
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
        {[{ label: "Live", value: live, color: "var(--color-success)" }, { label: "Draft", value: draft, color: "var(--color-warning)" }].map(({ label, value, color }) => (
          <div key={label} style={{ padding: "20px 24px", background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-xl)", boxShadow: "var(--color-card-shadow)" }}>
            <div style={{ fontSize: "28px", fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "6px" }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-xl)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "14px" }}>Loading…</div>
        ) : error ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--color-danger)", fontSize: "14px" }}>{error}</div>
        ) : albums.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center" }}>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "8px" }}>No albums yet</p>
            <button onClick={() => setModalAlbum("new")} style={{
              padding: "10px 20px", background: "var(--color-accent)", border: "none",
              borderRadius: "var(--radius-md)", fontSize: "13.5px", fontWeight: 600, color: "var(--color-accent-text)", cursor: "pointer",
            }}>
              Create first album
            </button>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Album", "Status", "Price", "Tracks", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", background: "var(--color-bg-subtle)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {albums.map((album) => (
                <tr key={album.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "36px", height: "36px", borderRadius: "var(--radius-sm)", flexShrink: 0,
                        background: album.coverImageUrl ? `url(${album.coverImageUrl}) center/cover` : "var(--color-bg-subtle)",
                        border: "1px solid var(--color-border)",
                      }} />
                      <span style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-primary)" }}>{album.title}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 20px" }}><StatusBadge status={album.status} /></td>
                  <td style={{ padding: "14px 20px", fontSize: "13px", color: "var(--color-text-muted)" }}>
                    {album.currency} {(album.priceCents / 100).toFixed(2)}
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: "13px", color: "var(--color-text-muted)" }}>
                    {album.tracks?.length ?? 0}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <Link href={`/admin/music/${album.id}`} style={{
                        display: "inline-flex", alignItems: "center", gap: "4px",
                        padding: "4px 12px", fontSize: "12px", fontWeight: 600,
                        color: "var(--color-accent)", background: "var(--color-accent-subtle)",
                        border: "1px solid var(--color-accent-border)", borderRadius: "var(--radius-md)", textDecoration: "none",
                      }}>
                        <ListMusic size={12} /> Tracks
                      </Link>
                      <button onClick={() => setModalAlbum(album)} style={{
                        padding: "4px 12px", fontSize: "12px", fontWeight: 600,
                        color: "var(--color-text-secondary)", background: "var(--color-bg-subtle)",
                        border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer",
                      }}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(album.id)} style={{
                        padding: "4px 12px", fontSize: "12px", fontWeight: 600,
                        color: "var(--color-danger)", background: "var(--color-danger-subtle)",
                        border: "1px solid var(--color-danger-subtle)", borderRadius: "var(--radius-md)", cursor: "pointer",
                      }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalAlbum && (
        <AlbumModal
          album={modalAlbum === "new" ? null : modalAlbum}
          onClose={() => setModalAlbum(null)}
          onSubmit={(input) => modalAlbum === "new" ? handleCreate(input) : handleUpdate((modalAlbum as Album).id, input)}
        />
      )}
    </div>
  );
}
