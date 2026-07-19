"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Maximize2, ListMusic, X } from "lucide-react";
import { useMusicPlayer } from "./MusicPlayerContext";
import VolumeControl from "./VolumeControl";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function MiniPlayer() {
  const {
    nowPlaying, isPlaying, kickedOut, hasNext, hasPrevious, repeatMode, currentTime, duration,
    queue, playbackRate, toggle, dismissKicked, playNext, playPrevious, cycleRepeat, cyclePlaybackRate, seek, play,
  } = useMusicPlayer();
  const [showQueue, setShowQueue] = useState(false);
  const router = useRouter();
  const goToSanctum = () => router.push("/");

  const RepeatIcon = repeatMode === "one" ? Repeat1 : Repeat;
  const progress = duration > 0 ? currentTime / duration : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!nowPlaying) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    seek(ratio * duration);
  };

  return (
    <div style={{ position: "fixed", bottom: "var(--pk-player-bottom)", left: "var(--pk-player-left)", right: "12px", zIndex: 20, display: "flex", flexDirection: "column", alignItems: "center" }}>
      {kickedOut && (
        <div style={{
          width: "100%", maxWidth: "1400px", marginBottom: "8px", padding: "10px 14px",
          background: "var(--color-warning-subtle)", border: "1px solid var(--color-warning)",
          borderRadius: "var(--radius-md)", fontSize: "12px", color: "var(--color-warning)",
          display: "flex", alignItems: "center", gap: "10px", boxSizing: "border-box",
        }}>
          <span style={{ flex: 1 }}>Playback stopped — this account is playing on another device.</span>
          <button onClick={dismissKicked} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "13px", flexShrink: 0 }}>✕</button>
        </div>
      )}

      {showQueue && nowPlaying && (
        <div style={{
          width: "100%", maxWidth: "1400px", boxSizing: "border-box", marginBottom: "8px",
          borderRadius: "16px", background: "var(--color-sidebar-bg)", border: "1px solid var(--color-sidebar-border)",
          boxShadow: "var(--color-card-shadow)", backdropFilter: "blur(16px)",
          maxHeight: "40vh", display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 10px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Track list
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--color-text-muted)" }}>{nowPlaying.albumTitle}</p>
            </div>
            <button
              onClick={() => setShowQueue(false)}
              aria-label="Close track list"
              style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "4px" }}
            >
              <X size={16} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 16px" }}>
            {queue.map((track, i) => {
              const isCurrent = track.id === nowPlaying.track.id;
              return (
                <button
                  key={track.id}
                  onClick={() => !track.isLocked && track.audioUrl && play(track, track.albumTitle ?? nowPlaying.albumTitle, track.albumCoverUrl ?? nowPlaying.albumCoverUrl, queue)}
                  disabled={track.isLocked}
                  style={{
                    display: "flex", alignItems: "center", gap: "12px", width: "100%", textAlign: "left",
                    padding: "9px 12px", background: isCurrent ? "var(--color-accent-subtle)" : "none",
                    border: "none", borderRadius: "var(--radius-md)",
                    cursor: track.isLocked ? "not-allowed" : "pointer", opacity: track.isLocked ? 0.5 : 1,
                  }}
                >
                  <span style={{ width: "18px", fontSize: "12px", color: isCurrent ? "var(--color-accent)" : "var(--color-text-muted)", flexShrink: 0 }}>
                    {isCurrent && isPlaying ? "♪" : i + 1}
                  </span>
                  <span style={{ flex: 1, fontSize: "13px", fontWeight: isCurrent ? 700 : 400, color: isCurrent ? "var(--color-accent)" : "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {track.title}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{formatTime(track.duration)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{
        width: "100%", maxWidth: "1400px", boxSizing: "border-box",
        display:         "flex",
        alignItems:      "center",
        gap:             "16px",
        padding:         "8px 16px",
        borderRadius:    "16px",
        background:      "var(--color-sidebar-bg)",
        border:          "1px solid var(--color-sidebar-border)",
        boxShadow:       "var(--color-card-shadow)",
        backdropFilter:  "blur(16px)",
      }}>
        <div
          onClick={() => nowPlaying && goToSanctum()}
          style={{
            width: "36px", height: "36px", borderRadius: "var(--radius-md)", flexShrink: 0, overflow: "hidden",
            cursor: nowPlaying ? "pointer" : "default",
            background: nowPlaying?.albumCoverUrl
              ? `url(${nowPlaying.albumCoverUrl}) center/cover`
              : "linear-gradient(135deg, hsl(38,65%,22%), hsl(16,50%,8%))",
            border: "1px solid var(--color-card-border)",
          }}
        />
        <div
          className="pk-miniplayer-title"
          onClick={() => nowPlaying && goToSanctum()}
          style={{ width: "150px", flexShrink: 0, cursor: nowPlaying ? "pointer" : "default", overflow: "hidden" }}
        >
          <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {nowPlaying?.track.title ?? "No track selected"}
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: "var(--color-text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {nowPlaying?.albumTitle ?? "Pick a track from Music"}
          </p>
        </div>

        <div className="pk-miniplayer-extra" style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <button onClick={playPrevious} disabled={!hasPrevious} style={smallIconStyle(hasPrevious)}>
            <SkipBack size={13} />
          </button>
        </div>
        <button
          onClick={toggle}
          disabled={!nowPlaying}
          style={{
            width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
            border: "none", background: nowPlaying ? "var(--color-accent)" : "var(--color-bg-subtle)",
            color: nowPlaying ? "var(--color-accent-text)" : "var(--color-text-muted)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: nowPlaying ? "pointer" : "not-allowed",
          }}
        >
          {isPlaying ? <Pause size={13} /> : <Play size={13} style={{ marginLeft: "1.5px" }} />}
        </button>
        <div className="pk-miniplayer-extra" style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <button onClick={playNext} disabled={!hasNext} style={smallIconStyle(hasNext)}>
            <SkipForward size={13} />
          </button>
          <button
            onClick={cycleRepeat}
            aria-label={`Repeat: ${repeatMode}`}
            style={smallIconStyle(true, repeatMode !== "off")}
          >
            <RepeatIcon size={12} />
          </button>
        </div>

        <div
          onClick={handleSeek}
          style={{ flex: 1, position: "relative", height: "4px", borderRadius: "2px", background: "var(--color-border)", cursor: nowPlaying ? "pointer" : "default" }}
        >
          <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${progress * 100}%`, borderRadius: "2px", background: "var(--color-accent)" }} />
        </div>

        <div className="pk-miniplayer-extra" style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <span style={{ fontSize: "10.5px", color: "var(--color-text-muted)" }}>{formatTime(currentTime)}</span>
          <span style={{ fontSize: "10.5px", color: "var(--color-text-muted)" }}>{formatTime(duration)}</span>

          <button
            onClick={cyclePlaybackRate}
            aria-label="Playback speed"
            style={{ ...smallIconStyle(true), width: "34px", borderRadius: "var(--radius-md)", fontSize: "10px", fontWeight: 700 }}
          >
            {playbackRate}x
          </button>

          <button
            onClick={() => setShowQueue((v) => !v)}
            disabled={!nowPlaying || queue.length === 0}
            aria-label="Track list"
            style={smallIconStyle(!!nowPlaying && queue.length > 0, queue.length > 0 && showQueue)}
          >
            <ListMusic size={13} />
          </button>

          <VolumeControl size={14} inline />
        </div>

        <button
          onClick={() => nowPlaying && goToSanctum()}
          disabled={!nowPlaying}
          aria-label="Open full player"
          title="Open full player"
          style={smallIconStyle(!!nowPlaying)}
        >
          <Maximize2 size={13} />
        </button>
      </div>
    </div>
  );
}

function smallIconStyle(enabled: boolean, active = false): React.CSSProperties {
  return {
    width: "26px", height: "26px", borderRadius: "50%", flexShrink: 0,
    background: active ? "var(--color-accent-subtle)" : "var(--color-bg-subtle)",
    border: `1px solid ${active ? "var(--color-accent-border)" : "var(--color-border)"}`,
    color: active ? "var(--color-accent)" : enabled ? "var(--color-text-secondary)" : "var(--color-text-muted)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: enabled ? "pointer" : "not-allowed",
  };
}
