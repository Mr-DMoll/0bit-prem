"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Maximize2, ListMusic, Loader2 } from "lucide-react";
import { useMusicPlayer } from "./MusicPlayerContext";
import VolumeControl from "./VolumeControl";
import TrackListPanel from "./TrackListPanel";
import LockedTrackPrompt from "./LockedTrackPrompt";
import type { PublicTrack } from "./services/music.service";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function MiniPlayer() {
  const {
    nowPlaying, isPlaying, isBuffering, kickedOut, hasNext, hasPrevious, repeatMode, currentTime, duration,
    queue, playbackRate, toggle, dismissKicked, playNext, playPrevious, cycleRepeat, cyclePlaybackRate, seek, play,
  } = useMusicPlayer();
  const [showQueue, setShowQueue] = useState(false);
  const [lockedTrack, setLockedTrack] = useState<PublicTrack | null>(null);
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
        <TrackListPanel
          queue={queue}
          currentTrackId={nowPlaying.track.id}
          isPlaying={isPlaying}
          subtitle={nowPlaying.albumTitle}
          onPlay={(track) => play(track, track.albumTitle ?? nowPlaying.albumTitle, track.albumCoverUrl ?? nowPlaying.albumCoverUrl, queue)}
          onLockedClick={setLockedTrack}
          onClose={() => setShowQueue(false)}
        />
      )}

      {lockedTrack && <LockedTrackPrompt track={lockedTrack} onClose={() => setLockedTrack(null)} />}

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
          {isBuffering && nowPlaying
            ? <Loader2 size={13} style={{ animation: "spin 0.9s linear infinite" }} />
            : isPlaying ? <Pause size={13} /> : <Play size={13} style={{ marginLeft: "1.5px" }} />}
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
