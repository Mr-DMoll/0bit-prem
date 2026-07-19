"use client";

import { useState, useCallback } from "react";
import { Check } from "lucide-react";
import { musicService, type Album, type AlbumInput, type Track } from "../services/music.service";
import { FileUploadField } from "./FileUploadField";
import { TrackStudio } from "./TrackStudio";

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

const STEPS = ["Metadata", "Cover", "Tracks"] as const;
type Step = typeof STEPS[number];

function StepIndicator({ current, completedSteps }: { current: Step; completedSteps: Set<Step> }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
      {STEPS.map((step, i) => {
        const isActive = step === current;
        const isDone = completedSteps.has(step);
        return (
          <div key={step} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "6px 14px",
              borderRadius: "var(--radius-pill)",
              background: isActive ? "var(--color-accent-subtle)" : isDone ? "var(--color-success-subtle)" : "var(--color-bg-subtle)",
              border: `1px solid ${isActive ? "var(--color-accent-border)" : isDone ? "var(--color-success)" : "var(--color-border)"}`,
            }}>
              {isDone && !isActive ? (
                <Check size={13} color="var(--color-success)" />
              ) : (
                <span style={{ fontSize: "11px", fontWeight: 700, color: isActive ? "var(--color-accent)" : "var(--color-text-muted)" }}>{i + 1}</span>
              )}
              <span style={{ fontSize: "12.5px", fontWeight: 600, color: isActive ? "var(--color-accent)" : isDone ? "var(--color-success)" : "var(--color-text-muted)" }}>
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && <div style={{ width: "24px", height: "1px", background: "var(--color-border)" }} />}
          </div>
        );
      })}
    </div>
  );
}

function MetadataStep({ initial, onSaved }: { initial: AlbumInput; onSaved: (album: Album) => void }) {
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description ?? "");
  const [price, setPrice] = useState(initial.priceCents ? (initial.priceCents / 100).toFixed(2) : "");
  const [releaseDate, setReleaseDate] = useState(initial.releaseDate ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price) return;
    setIsSubmitting(true); setError(null);
    try {
      const { data } = await musicService.createAlbum({
        title: title.trim(),
        description: description.trim() || undefined,
        priceCents: Math.round(parseFloat(price) * 100),
        releaseDate: releaseDate || undefined,
      });
      onSaved(data.album);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to save album.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px", maxWidth: "480px" }}>
      <div>
        <label style={labelStyle}>Title</label>
        <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
      </div>
      <div>
        <label style={labelStyle}>Description</label>
        <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "70px" }} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
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

      {error && (
        <div style={{ padding: "10px 14px", background: "var(--color-danger-subtle)", border: "1px solid var(--color-danger)", borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--color-danger)" }}>
          {error}
        </div>
      )}

      <button type="submit" disabled={isSubmitting} style={{
        alignSelf: "flex-start", padding: "10px 22px",
        background: isSubmitting ? "var(--color-accent-subtle)" : "var(--color-accent)",
        border: "none", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 700,
        color: "var(--color-accent-text)", cursor: isSubmitting ? "not-allowed" : "pointer",
      }}>
        {isSubmitting ? "Saving…" : "Save & Continue"}
      </button>
    </form>
  );
}

function CoverStep({ album, onSaved }: { album: Album; onSaved: (album: Album) => void }) {
  const [coverImageUrl, setCoverImageUrl] = useState(album.coverImageUrl ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    setIsSubmitting(true);
    try {
      const { data } = await musicService.updateAlbum(album.id, { coverImageUrl: coverImageUrl || undefined });
      onSaved(data.album);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "480px" }}>
      <FileUploadField label="Cover image" value={coverImageUrl} onChange={setCoverImageUrl} accept="image/*" folder="albums" />
      <button onClick={handleContinue} disabled={isSubmitting} style={{
        alignSelf: "flex-start", padding: "10px 22px",
        background: isSubmitting ? "var(--color-accent-subtle)" : "var(--color-accent)",
        border: "none", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 700,
        color: "var(--color-accent-text)", cursor: isSubmitting ? "not-allowed" : "pointer",
      }}>
        {isSubmitting ? "Saving…" : coverImageUrl ? "Save & Continue" : "Skip for now"}
      </button>
    </div>
  );
}

function TracksStep({ album, onFinalize }: { album: Album; onFinalize: () => void }) {
  const [tracks, setTracks] = useState<Track[]>(album.tracks ?? []);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const refetchTracks = useCallback(async () => {
    const { data } = await musicService.getAlbum(album.id);
    setTracks(data.album.tracks ?? []);
  }, [album.id]);

  const handleFinalize = async () => {
    setIsFinalizing(true);
    try {
      await musicService.updateAlbum(album.id, { status: "LIVE" });
      onFinalize();
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <TrackStudio albumId={album.id} tracks={tracks} onTracksChange={refetchTracks} />
      <button
        onClick={handleFinalize}
        disabled={tracks.length === 0 || isFinalizing}
        style={{
          alignSelf: "flex-start", padding: "12px 26px",
          background: (tracks.length === 0 || isFinalizing) ? "var(--color-accent-subtle)" : "var(--color-accent)",
          border: "none", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 700,
          color: "var(--color-accent-text)", cursor: (tracks.length === 0 || isFinalizing) ? "not-allowed" : "pointer",
        }}
      >
        {isFinalizing ? "Publishing…" : "Finalize & Go Live"}
      </button>
      {tracks.length === 0 && (
        <p style={{ margin: 0, fontSize: "12px", color: "var(--color-text-muted)" }}>Add at least one track before going live.</p>
      )}
    </div>
  );
}

export function AlbumWizard({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [step, setStep] = useState<Step>("Metadata");
  const [album, setAlbum] = useState<Album | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());

  const goToStep = (target: Step, updatedAlbum?: Album) => {
    if (updatedAlbum) setAlbum(updatedAlbum);
    setCompletedSteps((prev) => new Set(prev).add(step));
    setStep(target);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{
        position: "relative", zIndex: 10, width: "100%", maxWidth: "760px",
        background: "var(--color-card-bg)", border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)", padding: "32px", boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
            {album ? album.title : "New Album"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", fontSize: "18px" }}>✕</button>
        </div>
        <p style={{ margin: "0 0 20px", fontSize: "12.5px", color: "var(--color-text-muted)" }}>
          Progress is saved as you go — closing early just leaves this as a draft.
        </p>

        <StepIndicator current={step} completedSteps={completedSteps} />

        {step === "Metadata" && (
          <MetadataStep
            initial={{ title: "", priceCents: 0 }}
            onSaved={(a) => goToStep("Cover", a)}
          />
        )}
        {step === "Cover" && album && (
          <CoverStep album={album} onSaved={(a) => goToStep("Tracks", a)} />
        )}
        {step === "Tracks" && album && (
          <TracksStep album={album} onFinalize={onComplete} />
        )}
      </div>
    </div>
  );
}
