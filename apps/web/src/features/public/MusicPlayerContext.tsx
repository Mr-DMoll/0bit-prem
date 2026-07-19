"use client";

import { createContext, useContext, useRef, useState, useCallback, useEffect } from "react";
import { useAuth } from "@/shared/context/AuthContext";
import { sessionsService, getDeviceId } from "./services/sessions.service";
import type { PublicTrack } from "./services/music.service";

export interface NowPlaying {
  track: PublicTrack;
  albumTitle: string;
  albumCoverUrl: string | null;
}

export type RepeatMode = "off" | "all" | "one";

export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2] as const;

interface MusicPlayerContextType {
  nowPlaying: NowPlaying | null;
  isPlaying: boolean;
  kickedOut: boolean;
  currentTime: number;
  duration: number;
  queue: PublicTrack[];
  hasNext: boolean;
  hasPrevious: boolean;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  playbackRate: number;
  play: (track: PublicTrack, albumTitle: string, albumCoverUrl: string | null, queue?: PublicTrack[]) => void;
  toggle: () => void;
  seek: (time: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  dismissKicked: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  cycleRepeat: () => void;
  setRepeatMode: (mode: RepeatMode) => void;
  cyclePlaybackRate: () => void;
}

const CHECK_INTERVAL_MS = 5000;
const VOLUME_STORAGE_KEY = "pk_volume";

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [kickedOut, setKickedOut]   = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]       = useState(0);
  const [queue, setQueue] = useState<PublicTrack[]>([]);
  const [queueAlbum, setQueueAlbum] = useState<{ title: string; coverUrl: string | null } | null>(null);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [repeatMode, setRepeatModeState] = useState<RepeatMode>("off");
  const [playbackRate, setPlaybackRateState] = useState<number>(1);

  useEffect(() => {
    const stored = localStorage.getItem(VOLUME_STORAGE_KEY);
    if (stored !== null) setVolumeState(parseFloat(stored));
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, []);

  // While a logged-in user is actively playing, poll to see if another
  // device has claimed this account — if so, stop playback here.
  useEffect(() => {
    if (!user || !isPlaying) return;

    const deviceId = getDeviceId();
    const interval = setInterval(() => {
      sessionsService.check(deviceId).then((res) => {
        if (!res.data?.active) {
          audioRef.current?.pause();
          setIsPlaying(false);
          setKickedOut(true);
        }
      }).catch(() => {});
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [user, isPlaying]);

  const play = useCallback((track: PublicTrack, albumTitle: string, albumCoverUrl: string | null, trackQueue?: PublicTrack[]) => {
    if (!track.audioUrl) return;
    const audio = audioRef.current;
    if (!audio) return;

    if (user) {
      sessionsService.claim(getDeviceId()).catch(() => {});
      setKickedOut(false);
    }

    if (trackQueue) {
      setQueue(trackQueue);
      setQueueAlbum({ title: albumTitle, coverUrl: albumCoverUrl });
    }

    if (nowPlaying?.track.id === track.id && !audio.error) {
      // Same track, no error — just resume.
      audio.play();
      setIsPlaying(true);
      return;
    }

    audio.src = track.audioUrl;
    audio.load();
    audio.volume = isMuted ? 0 : volume;
    audio.playbackRate = playbackRate;
    audio.play();
    setNowPlaying({ track, albumTitle, albumCoverUrl });
    setIsPlaying(true);
  }, [nowPlaying, user, isMuted, volume, playbackRate]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !nowPlaying) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (user) sessionsService.claim(getDeviceId()).catch(() => {});
      audio.play();
      setIsPlaying(true);
    }
  }, [isPlaying, nowPlaying, user]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio || !nowPlaying) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, [nowPlaying]);

  const queueIndex = nowPlaying ? queue.findIndex((t) => t.id === nowPlaying.track.id) : -1;
  const hasNext = queueIndex >= 0 && queueIndex < queue.length - 1;
  const hasPrevious = queueIndex > 0;

  const playNext = useCallback(() => {
    if (!hasNext || !queueAlbum) return;
    const next = queue[queueIndex + 1];
    if (next.isLocked || !next.audioUrl) return;
    play(next, next.albumTitle ?? queueAlbum.title, next.albumCoverUrl ?? queueAlbum.coverUrl, queue);
  }, [hasNext, queue, queueIndex, queueAlbum, play]);

  const playPrevious = useCallback(() => {
    if (!hasPrevious || !queueAlbum) return;
    const prev = queue[queueIndex - 1];
    if (prev.isLocked || !prev.audioUrl) return;
    play(prev, prev.albumTitle ?? queueAlbum.title, prev.albumCoverUrl ?? queueAlbum.coverUrl, queue);
  }, [hasPrevious, queue, queueIndex, queueAlbum, play]);

  // Handles track-end behavior — depends on live repeat/queue state, so it's
  // re-bound whenever that state changes rather than living in the mount-once effect.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      if (repeatMode === "one") {
        audio.currentTime = 0;
        audio.play();
        return;
      }
      if (repeatMode === "all" && nowPlaying && queue.length > 0 && queueAlbum) {
        const idx = queue.findIndex((t) => t.id === nowPlaying.track.id);
        const next = queue[(idx + 1) % queue.length];
        if (next.audioUrl && !next.isLocked) {
          play(next, next.albumTitle ?? queueAlbum.title, next.albumCoverUrl ?? queueAlbum.coverUrl, queue);
          return;
        }
      }
      setIsPlaying(false);
    };
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, [repeatMode, queue, queueAlbum, nowPlaying, play]);

  const dismissKicked = useCallback(() => setKickedOut(false), []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.min(1, Math.max(0, v));
    setVolumeState(clamped);
    setIsMuted(false);
    localStorage.setItem(VOLUME_STORAGE_KEY, String(clamped));
  }, []);

  const toggleMute = useCallback(() => setIsMuted((m) => !m), []);

  const cycleRepeat = useCallback(() => {
    setRepeatModeState((m) => (m === "off" ? "all" : m === "all" ? "one" : "off"));
  }, []);

  const setRepeatMode = useCallback((mode: RepeatMode) => setRepeatModeState(mode), []);

  const cyclePlaybackRate = useCallback(() => {
    setPlaybackRateState((r) => {
      const idx = PLAYBACK_RATES.indexOf(r as any);
      return PLAYBACK_RATES[(idx + 1) % PLAYBACK_RATES.length];
    });
  }, []);

  return (
    <MusicPlayerContext.Provider value={{
      nowPlaying, isPlaying, kickedOut, currentTime, duration, queue, hasNext, hasPrevious,
      volume, isMuted, repeatMode, playbackRate,
      play, toggle, seek, playNext, playPrevious, dismissKicked,
      setVolume, toggleMute, cycleRepeat, setRepeatMode, cyclePlaybackRate,
    }}>
      {children}
      <audio ref={audioRef} />
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) throw new Error("useMusicPlayer must be used within MusicPlayerProvider");
  return ctx;
}
