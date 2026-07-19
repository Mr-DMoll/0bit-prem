"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Repeat, Repeat1, SkipBack, SkipForward, ListMusic, Loader2 } from "lucide-react";
import { useMusicPlayer } from "@/features/public/MusicPlayerContext";
import { publicMusicService, type PublicTrack } from "@/features/public/services/music.service";
import { YantraRing, EqBars } from "@/features/public/SanctumRing";
import { SanctumBackdrop } from "@/features/public/SanctumBackdrop";
import VolumeControl from "@/features/public/VolumeControl";
import TrackListPanel from "@/features/public/TrackListPanel";
import LockedTrackPrompt from "@/features/public/LockedTrackPrompt";

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
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
    nowPlaying, isPlaying, isBuffering, play, toggle, setRepeatMode,
    hasNext, hasPrevious, playNext, playPrevious, repeatMode, cycleRepeat, queue,
  } = useMusicPlayer();
  const [mix, setMix] = useState<{ mode: "owned" | "sampler"; queue: PublicTrack[] } | null>(null);
  const [showQueue, setShowQueue] = useState(false);
  const [lockedTrack, setLockedTrack] = useState<PublicTrack | null>(null);

  useEffect(() => {
    publicMusicService.getSanctumMix()
      .then((res) => {
        // Pick one random album to arrive on, rather than shuffling every
        // track from every album into one mixed queue — the album itself is
        // the random part; once you land on it, the track list and skip
        // next/prev stay scoped to that album's own, real track order.
        const byAlbum = new Map<string, PublicTrack[]>();
        for (const t of res.data.tracks) {
          const key = t.albumId ?? "";
          (byAlbum.get(key) ?? byAlbum.set(key, []).get(key)!).push(t);
        }
        const [chosenAlbumId] = shuffle([...byAlbum.keys()]);
        const albumQueue = (byAlbum.get(chosenAlbumId) ?? []).sort((a, b) => a.order - b.order);
        setMix({ mode: res.data.mode, queue: albumQueue });
      })
      .catch(() => setMix({ mode: "sampler", queue: [] }));
  }, []);

  const firstPlayable = mix?.queue.find((t) => !t.isLocked && t.audioUrl);

  const handleToggle = useCallback(() => {
    if (nowPlaying) {
      toggle();
      return;
    }
    if (!firstPlayable) return;
    setRepeatMode("all");
    play(firstPlayable, firstPlayable.albumTitle ?? "", firstPlayable.albumCoverUrl ?? null, mix!.queue);
  }, [firstPlayable, mix, nowPlaying, toggle, play, setRepeatMode]);

  const hasQueue = !!firstPlayable;
  const playing = !!nowPlaying && isPlaying;
  const track = nowPlaying?.track ?? firstPlayable;
  const albumTitle = nowPlaying?.albumTitle ?? firstPlayable?.albumTitle;
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
                {isBuffering && nowPlaying
                  ? <Loader2 size={22} color="var(--color-accent)" style={{ animation: "spin 0.9s linear infinite" }} />
                  : playing
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
            <div className="pk-sanctum-controls" style={{ alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: "10px", marginBottom: "var(--pk-sanctum-gap-sm)" }}>
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
            <TrackListPanel
              queue={queue}
              currentTrackId={nowPlaying.track.id}
              isPlaying={isPlaying}
              subtitle={nowPlaying.albumTitle}
              onPlay={(t) => play(t, t.albumTitle ?? nowPlaying.albumTitle, t.albumCoverUrl ?? nowPlaying.albumCoverUrl, queue)}
              onLockedClick={setLockedTrack}
              onClose={() => setShowQueue(false)}
            />
          )}

          {lockedTrack && <LockedTrackPrompt track={lockedTrack} onClose={() => setLockedTrack(null)} />}

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
