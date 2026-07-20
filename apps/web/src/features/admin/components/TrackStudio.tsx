"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, Play, Pause, GripVertical, Trash2, Check, X } from "lucide-react";
import { musicService, type Track, type TrackInput } from "../services/music.service";
import { uploadsService } from "../services/uploads.service";

const inputStyle: React.CSSProperties = {
  padding: "8px 10px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-sm)", fontSize: "13px", color: "var(--color-text-primary)",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};

function formatDuration(seconds: number) {
  if (!seconds) return "—";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

function deriveTitleFromFilename(filename: string): string {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/^\d+[_\-\s]*/, "")
    .replace(/_/g, " ")
    .trim() || filename;
}

interface StagedFile {
  key: string;
  file: File;
  title: string;
  duration: number;
  isFree: boolean;
  status: "staged" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

function StagedRow({ staged, onChange, onRemove }: {
  staged: StagedFile;
  onChange: (key: string, patch: Partial<StagedFile>) => void;
  onRemove: (key: string) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => { if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current); };
  }, []);

  const togglePreview = () => {
    if (!audioRef.current) {
      objectUrlRef.current = URL.createObjectURL(staged.file);
      audioRef.current = new Audio(objectUrlRef.current);
      audioRef.current.addEventListener("ended", () => setIsPlaying(false));
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "32px 1fr 90px 70px 90px 32px", gap: "10px", alignItems: "center",
      padding: "10px 14px", borderBottom: "1px solid var(--color-border)",
    }}>
      <button
        type="button" onClick={togglePreview}
        style={{ width: "28px", height: "28px", borderRadius: "50%", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        {isPlaying ? <Pause size={12} /> : <Play size={12} style={{ marginLeft: "1px" }} />}
      </button>

      <input
        style={inputStyle} value={staged.title}
        onChange={(e) => onChange(staged.key, { title: e.target.value })}
        disabled={staged.status === "uploading" || staged.status === "success"}
      />

      <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{formatDuration(staged.duration)}</span>

      <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11.5px", color: "var(--color-text-secondary)" }}>
        <input
          type="checkbox" checked={staged.isFree}
          onChange={(e) => onChange(staged.key, { isFree: e.target.checked })}
          disabled={staged.status === "uploading" || staged.status === "success"}
        /> Free
      </label>

      <div style={{ fontSize: "11px" }}>
        {staged.status === "staged" && <span style={{ color: "var(--color-text-muted)" }}>Ready</span>}
        {staged.status === "uploading" && (
          <div style={{ width: "100%", height: "5px", background: "var(--color-bg-subtle)", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ width: `${staged.progress}%`, height: "100%", background: "var(--color-accent)", transition: "width 0.15s" }} />
          </div>
        )}
        {staged.status === "success" && <span style={{ color: "var(--color-success)", display: "flex", alignItems: "center", gap: "3px" }}><Check size={12} /> Done</span>}
        {staged.status === "error" && <span style={{ color: "var(--color-danger)" }}>Failed</span>}
      </div>

      <button
        type="button" onClick={() => onRemove(staged.key)}
        disabled={staged.status === "uploading"}
        style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: staged.status === "uploading" ? "not-allowed" : "pointer", display: "flex" }}
      >
        <X size={15} />
      </button>
    </div>
  );
}

interface LiveTrack extends Track {
  _markedForDelete?: boolean;
}

export function TrackStudio({ albumId, tracks, onTracksChange }: {
  albumId: string;
  tracks: Track[];
  onTracksChange: () => void | Promise<void>;
}) {
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [liveTracks, setLiveTracks] = useState<LiveTrack[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const dragIndexRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLiveTracks(tracks.slice().sort((a, b) => a.order - b.order));
    setIsDirty(false);
  }, [tracks]);

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList);
    const entries: StagedFile[] = files.map((file) => ({
      key: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
      file,
      title: deriveTitleFromFilename(file.name),
      duration: 0,
      isFree: false,
      status: "staged",
      progress: 0,
    }));
    setStaged((prev) => [...prev, ...entries]);

    // Read real duration off each file client-side.
    entries.forEach((entry) => {
      const objectUrl = URL.createObjectURL(entry.file);
      const probe = new Audio(objectUrl);
      probe.addEventListener("loadedmetadata", () => {
        setStaged((prev) => prev.map((s) => s.key === entry.key ? { ...s, duration: Math.round(probe.duration) || 0 } : s));
        URL.revokeObjectURL(objectUrl);
      });
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const updateStaged = useCallback((key: string, patch: Partial<StagedFile>) => {
    setStaged((prev) => prev.map((s) => s.key === key ? { ...s, ...patch } : s));
  }, []);

  const removeStaged = useCallback((key: string) => {
    setStaged((prev) => prev.filter((s) => s.key !== key));
  }, []);

  const handleUploadAll = async () => {
    const pending = staged.filter((s) => s.status === "staged" || s.status === "error");
    if (pending.length === 0) return;
    setIsUploading(true);

    const results = await Promise.all(pending.map(async (entry) => {
      updateStaged(entry.key, { status: "uploading", progress: 0 });
      try {
        const url = await uploadsService.uploadTrack(entry.file, (pct) => updateStaged(entry.key, { progress: pct }));
        updateStaged(entry.key, { status: "success", progress: 100 });
        return { entry, url, ok: true as const };
      } catch {
        updateStaged(entry.key, { status: "error" });
        return { entry, ok: false as const };
      }
    }));

    const succeeded = results.filter((r): r is { entry: StagedFile; url: string; ok: true } => r.ok);
    if (succeeded.length > 0) {
      const input: TrackInput[] = succeeded.map(({ entry, url }) => ({
        title: entry.title.trim() || "Untitled",
        audioUrl: url,
        duration: entry.duration,
        isFree: entry.isFree,
      }));
      await musicService.createTracksBatch(albumId, input);
      setStaged((prev) => prev.filter((s) => !succeeded.some((r) => r.entry.key === s.key)));
      await onTracksChange();
    }

    setIsUploading(false);
  };

  const handleDragStart = (index: number) => { dragIndexRef.current = index; };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (index: number) => {
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    if (from === null || from === index) return;
    setLiveTracks((prev) => {
      const next = prev.slice();
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setIsDirty(true);
  };

  const handleRename = (id: string, title: string) => {
    setLiveTracks((prev) => prev.map((t) => t.id === id ? { ...t, title } : t));
    setIsDirty(true);
  };

  const handleToggleFree = (id: string, isFree: boolean) => {
    setLiveTracks((prev) => prev.map((t) => t.id === id ? { ...t, isFree } : t));
    setIsDirty(true);
  };

  const handleMarkDelete = (id: string) => {
    setLiveTracks((prev) => prev.map((t) => t.id === id ? { ...t, _markedForDelete: !t._markedForDelete } : t));
    setIsDirty(true);
  };

  const handleCommit = async () => {
    setIsCommitting(true);
    try {
      const deletes = liveTracks.filter((t) => t._markedForDelete).map((t) => t.id);
      const updates = liveTracks
        .filter((t) => !t._markedForDelete)
        .map((t, i) => ({ id: t.id, title: t.title, isFree: t.isFree, order: i }));
      await musicService.bulkUpdateTracks(albumId, updates, deletes);
      await onTracksChange();
    } finally {
      setIsCommitting(false);
    }
  };

  const handleDiscard = () => {
    setLiveTracks(tracks.slice().sort((a, b) => a.order - b.order));
    setIsDirty(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-xl)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: staged.length > 0 ? "1px solid var(--color-border)" : "none" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>Add tracks</h3>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--color-text-muted)" }}>Select multiple audio files at once — titles and duration are picked up automatically.</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button" onClick={() => fileInputRef.current?.click()}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)", cursor: "pointer" }}
            >
              <Upload size={14} /> Choose files
            </button>
            {staged.some((s) => s.status === "staged" || s.status === "error") && (
              <button
                type="button" onClick={handleUploadAll} disabled={isUploading}
                style={{ padding: "9px 18px", background: isUploading ? "var(--color-accent-subtle)" : "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)", fontSize: "13px", fontWeight: 700, color: "var(--color-accent-text)", cursor: isUploading ? "not-allowed" : "pointer" }}
              >
                {isUploading ? "Uploading…" : `Upload ${staged.filter((s) => s.status !== "success").length}`}
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="audio/*" multiple hidden onChange={(e) => handleFilesSelected(e.target.files)} />
        </div>

        {staged.length > 0 && (
          <div>
            {staged.map((s) => (
              <StagedRow key={s.key} staged={s} onChange={updateStaged} onRemove={removeStaged} />
            ))}
          </div>
        )}
      </div>

      <div style={{ background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-xl)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--color-border)" }}>
          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>Tracklist</h3>
          {isDirty && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "12px", color: "var(--color-warning)" }}>Unsaved changes</span>
              <button type="button" onClick={handleDiscard} style={{ padding: "7px 14px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "12.5px", fontWeight: 600, color: "var(--color-text-secondary)", cursor: "pointer" }}>
                Discard
              </button>
              <button type="button" onClick={handleCommit} disabled={isCommitting} style={{ padding: "7px 14px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)", fontSize: "12.5px", fontWeight: 700, color: "var(--color-accent-text)", cursor: isCommitting ? "not-allowed" : "pointer" }}>
                {isCommitting ? "Saving…" : "Commit"}
              </button>
            </div>
          )}
        </div>

        {liveTracks.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13.5px" }}>No tracks yet — add some above.</div>
        ) : (
          liveTracks.map((track, i) => (
            <div
              key={track.id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(i)}
              style={{
                display: "grid", gridTemplateColumns: "24px 1fr 70px 70px 32px", gap: "10px", alignItems: "center",
                padding: "10px 20px", borderBottom: "1px solid var(--color-border)",
                opacity: track._markedForDelete ? 0.4 : 1,
                background: "var(--color-card-bg)", cursor: "grab",
              }}
            >
              <GripVertical size={15} color="var(--color-text-muted)" />
              <input
                style={{ ...inputStyle, fontWeight: 600, textDecoration: track._markedForDelete ? "line-through" : "none" }}
                value={track.title}
                onChange={(e) => handleRename(track.id, e.target.value)}
                disabled={track._markedForDelete}
              />
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{formatDuration(track.duration)}</span>
              <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11.5px", color: "var(--color-text-secondary)" }}>
                <input type="checkbox" checked={track.isFree} onChange={(e) => handleToggleFree(track.id, e.target.checked)} disabled={track._markedForDelete} /> Free
              </label>
              <button
                type="button" onClick={() => handleMarkDelete(track.id)}
                style={{ background: "none", border: "none", color: track._markedForDelete ? "var(--color-text-muted)" : "var(--color-danger)", cursor: "pointer", display: "flex" }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
