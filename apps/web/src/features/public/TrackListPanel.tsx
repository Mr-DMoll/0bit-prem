"use client";

import { Lock, X } from "lucide-react";
import type { PublicTrack } from "./services/music.service";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function TrackListPanel({
  queue, currentTrackId, isPlaying, subtitle, onPlay, onLockedClick, onClose,
}: {
  queue: PublicTrack[];
  currentTrackId?: string;
  isPlaying: boolean;
  subtitle?: string;
  onPlay: (track: PublicTrack) => void;
  onLockedClick: (track: PublicTrack) => void;
  onClose: () => void;
}) {
  return (
    <div style={{
      position: "fixed", top: "96px", right: "20px",
      bottom: "calc(var(--pk-player-bottom) + 68px)",
      width: "min(340px, calc(100vw - 40px))",
      zIndex: 21, display: "flex", flexDirection: "column", overflow: "hidden",
      borderRadius: "20px",
      background: "var(--color-sidebar-bg)", border: "1px solid var(--color-sidebar-border)",
      boxShadow: "var(--color-card-shadow)", backdropFilter: "blur(16px)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 10px", flexShrink: 0 }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: "12.5px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Track list
          </h3>
          {subtitle && (
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {subtitle}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close track list"
          style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "4px", flexShrink: 0 }}
        >
          <X size={16} />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 14px" }}>
        {queue.map((t, i) => {
          const isCurrent = t.id === currentTrackId;
          return (
            <button
              key={t.id}
              onClick={() => (t.isLocked ? onLockedClick(t) : onPlay(t))}
              style={{
                display: "flex", alignItems: "center", gap: "12px", width: "100%", textAlign: "left",
                padding: "9px 12px", background: isCurrent ? "var(--color-accent-subtle)" : "none",
                border: "none", borderRadius: "var(--radius-md)", cursor: "pointer",
              }}
            >
              <span style={{
                width: "18px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "12px", color: isCurrent ? "var(--color-accent)" : "var(--color-text-muted)",
              }}>
                {t.isLocked ? <Lock size={11} /> : isCurrent && isPlaying ? "♪" : i + 1}
              </span>
              <span style={{
                flex: 1, fontSize: "13px", fontWeight: isCurrent ? 700 : 400,
                color: isCurrent ? "var(--color-accent)" : t.isLocked ? "var(--color-text-muted)" : "var(--color-text-primary)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {t.title}
              </span>
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)", flexShrink: 0 }}>{formatTime(t.duration)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
