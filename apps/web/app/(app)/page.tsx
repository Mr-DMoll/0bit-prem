"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Repeat, Repeat1, SkipBack, SkipForward, ListMusic, X } from "lucide-react";
import { useMusicPlayer } from "@/features/public/MusicPlayerContext";
import { publicMusicService, type PublicTrack } from "@/features/public/services/music.service";
import { YantraRing, EqBars } from "@/features/public/SanctumRing";
import { SanctumBackdrop } from "@/features/public/SanctumBackdrop";
import VolumeControl from "@/features/public/VolumeControl";

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function controlBtnStyle(enabled: boolean, active = false): React.CSSProperties {
  return {
    width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0,
    background: active ? "var(--color-accent-subtle)" : "var(--color-bg-subtle)",
    border: `1px solid ${active ? "var(--color-accent-border)" : "var(--color-border)"}`,
    color: active ? "var(--color-accent)" : enabled ? "var(--color-text-secondary)" : "var(--color-text-muted)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: enabled ? "pointer" : "not-allowed",
  };
}

export default function SanctumPage() {
  const {
    nowPlaying, isPlaying, play, toggle, setRepeatMode,
    hasNext, hasPrevious, playNext, playPrevious, repeatMode, cycleRepeat, queue,
  } = useMusicPlayer();
  const [mix, setMix] = useState<{ mode: "owned" | "sampler"; queue: PublicTrack[] } | null>(null);
  const [showQueue, setShowQueue] = useState(false);

  useEffect(() => {
    publicMusicService.getSanctumMix()
      .then((res) => setMix({ mode: res.data.mode, queue: shuffle(res.data.tracks) }))
      .catch(() => setMix({ mode: "sampler", queue: [] }));
  }, []);

  const handleToggle = useCallback(() => {
    if (nowPlaying) {
      toggle();
      return;
    }
    if (!mix || mix.queue.length === 0) return;
    const [first] = mix.queue;
    setRepeatMode("all");
    play(first, first.albumTitle ?? "", first.albumCoverUrl ?? null, mix.queue);
  }, [mix, nowPlaying, toggle, play, setRepeatMode]);

  const hasQueue = !!mix && mix.queue.length > 0;
  const playing = !!nowPlaying && isPlaying;
  const track = nowPlaying?.track ?? mix?.queue[0];
  const albumTitle = nowPlaying?.albumTitle ?? mix?.queue[0]?.albumTitle;
  const RING = 360;

  // Sanctum is a single screen, not a scrolling page — its height is pinned to
  // exactly what's left after <main>'s own top padding and the space it
  // reserves for the fixed player bar/tab bar, so nothing here ever scrolls.
  const availableHeight = `calc(100dvh - 28px - var(${nowPlaying ? "--pk-content-bottom-playing" : "--pk-content-bottom-idle"}))`;

  return (
    <div style={{ position: "relative", height: availableHeight, overflow: "hidden" }}>
      <SanctumBackdrop playing={playing} />

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 1, height: availableHeight, overflow: "hidden",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "var(--pk-sanctum-pad-v) 24px", textAlign: "center",
      }}>
        <p style={{ fontSize: "9.5px", letterSpacing: "0.38em", textTransform: "uppercase", color: "hsl(38,92%,50%,0.45)", margin: "0 0 var(--pk-sanctum-gap)" }}>
          Premvkay
        </p>

        <div style={{
          position: "relative", width: "var(--pk-ring-size)", height: "var(--pk-ring-size)", flexShrink: 0,
          animation: playing ? "none" : "pk-ring-breath 5s ease-in-out infinite",
        }}>
          <YantraRing size={RING} />

          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
            <div style={{ position: "relative", width: "var(--pk-orb-size)", height: "var(--pk-orb-size)" }}>
              {!playing && (
                <>
                  <div style={{
                    position: "absolute", top: "50%", left: "50%", width: "var(--pk-orb-size)", height: "var(--pk-orb-size)", borderRadius: "50%",
                    transform: "translate(-50%, -50%)",
                    border: "1px solid var(--color-accent)", animation: "pk-pulse-ring 3s ease-out infinite",
                  }} />
                  <div style={{
                    position: "absolute", top: "50%", left: "50%", width: "var(--pk-orb-size)", height: "var(--pk-orb-size)", borderRadius: "50%",
                    transform: "translate(-50%, -50%)",
                    border: "1px solid var(--color-accent)", animation: "pk-pulse-ring 3s ease-out 1.5s infinite",
                  }} />
                </>
              )}
              <button
                onClick={handleToggle}
                disabled={!nowPlaying && !hasQueue}
                className={playing ? "pk-orb-playing" : "pk-orb-idle"}
                aria-label={playing ? "Pause" : nowPlaying ? "Play" : "Begin"}
                style={{
                  position: "absolute", inset: 0, borderRadius: "50%", padding: 0,
                  background: playing
                    ? "radial-gradient(circle at 38% 32%, hsl(38,92%,50%,0.35), hsl(38,92%,50%,0.12))"
                    : "radial-gradient(circle at 38% 32%, hsl(38,92%,50%,0.24), hsl(38,92%,50%,0.07))",
                  border: `1px solid hsl(38,92%,50%,${playing ? 0.6 : 0.4})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: nowPlaying || hasQueue ? "pointer" : "default", outline: "none",
                  transition: "background 0.9s ease, border-color 0.9s ease",
                }}
              >
                {playing
                  ? <EqBars />
                  : <span style={{ fontSize: "1.8rem", color: "var(--color-accent)", opacity: 0.9, userSelect: "none", marginTop: "2px" }}>ॐ</span>}
              </button>
            </div>
          </div>

          <div style={{ position: "absolute", bottom: "18%", left: 0, right: 0, textAlign: "center" }}>
            <span style={{ fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
              {nowPlaying ? (playing ? "playing" : "paused") : hasQueue ? "tap to enter" : "quiet, for now"}
            </span>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "var(--pk-sanctum-gap)" }}>
          <p style={{
            fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase",
            color: nowPlaying ? "var(--color-accent)" : "hsl(38,92%,50%,0.4)",
            margin: "0 0 8px", transition: "color 0.9s ease",
          }}>
            {nowPlaying ? "Now playing" : hasQueue ? "Up next" : "Sanctum"}
          </p>
          <h1 style={{
            fontFamily: "var(--font-cormorant), serif", fontWeight: 300,
            fontSize: "var(--pk-sanctum-title-size)", lineHeight: 1.08, letterSpacing: "-0.01em",
            color: "rgba(255,246,228,0.9)", margin: "0 0 6px",
          }}>
            {track?.title ?? "The music will begin soon"}
          </h1>
          {albumTitle && (
            <p style={{
              fontFamily: "var(--font-cormorant), serif", fontStyle: "italic", fontWeight: 300,
              fontSize: "1.05rem", color: "hsl(38,92%,50%,0.55)", margin: "0 0 var(--pk-sanctum-gap-sm)",
            }}>
              {albumTitle}
            </p>
          )}

          {nowPlaying && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: "10px", marginBottom: "var(--pk-sanctum-gap-sm)" }}>
              <VolumeControl size={15} />
              <button onClick={cycleRepeat} aria-label={`Repeat: ${repeatMode}`} style={controlBtnStyle(true, repeatMode !== "off")}>
                {repeatMode === "one" ? <Repeat1 size={15} /> : <Repeat size={15} />}
              </button>
              <button onClick={playPrevious} disabled={!hasPrevious} style={controlBtnStyle(hasPrevious)}>
                <SkipBack size={15} />
              </button>
              <button onClick={playNext} disabled={!hasNext} style={controlBtnStyle(hasNext)}>
                <SkipForward size={15} />
              </button>
              <button
                onClick={() => setShowQueue((v) => !v)}
                disabled={queue.length === 0}
                aria-label="Track list"
                style={controlBtnStyle(queue.length > 0, queue.length > 0 && showQueue)}
              >
                <ListMusic size={15} />
              </button>
            </div>
          )}

          {showQueue && nowPlaying && (
            <div style={{
              width: "min(90vw, 360px)", maxHeight: "40vh", margin: "0 auto 24px", textAlign: "left",
              borderRadius: "16px", background: "var(--color-sidebar-bg)", border: "1px solid var(--color-sidebar-border)",
              boxShadow: "var(--color-card-shadow)", display: "flex", flexDirection: "column", overflow: "hidden",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 8px" }}>
                <h3 style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Track list
                </h3>
                <button onClick={() => setShowQueue(false)} aria-label="Close track list" style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "4px" }}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 12px" }}>
                {queue.map((t, i) => {
                  const isCurrent = t.id === nowPlaying.track.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => !t.isLocked && t.audioUrl && play(t, t.albumTitle ?? nowPlaying.albumTitle, t.albumCoverUrl ?? nowPlaying.albumCoverUrl, queue)}
                      disabled={t.isLocked}
                      style={{
                        display: "flex", alignItems: "center", gap: "10px", width: "100%", textAlign: "left",
                        padding: "8px 10px", background: isCurrent ? "var(--color-accent-subtle)" : "none",
                        border: "none", borderRadius: "var(--radius-md)",
                        cursor: t.isLocked ? "not-allowed" : "pointer", opacity: t.isLocked ? 0.5 : 1,
                      }}
                    >
                      <span style={{ width: "16px", fontSize: "11px", color: isCurrent ? "var(--color-accent)" : "var(--color-text-muted)", flexShrink: 0 }}>
                        {isCurrent && isPlaying ? "♪" : i + 1}
                      </span>
                      <span style={{ flex: 1, fontSize: "12.5px", fontWeight: isCurrent ? 700 : 400, color: isCurrent ? "var(--color-accent)" : "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.title}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--color-text-muted)", flexShrink: 0 }}>{formatTime(t.duration)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <Link
            href="/music"
            style={{
              fontSize: "9.5px", letterSpacing: "0.2em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.17)", textDecoration: "none", transition: "color 0.3s ease",
            }}
          >
            Explore the catalog →
          </Link>
        </div>
      </div>
    </div>
  );
}
