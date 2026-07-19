"use client";

import { useState, useRef, useEffect } from "react";
import { Volume, Volume1, Volume2, VolumeX } from "lucide-react";
import { useMusicPlayer } from "./MusicPlayerContext";

export default function VolumeControl({ size = 16, inline = false }: { size?: number; inline?: boolean }) {
  const { volume, isMuted, setVolume, toggleMute } = useMusicPlayer();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const effectiveVolume = isMuted ? 0 : volume;
  const Icon = effectiveVolume === 0 ? VolumeX : effectiveVolume < 0.5 ? Volume1 : Volume2;

  if (inline) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <button
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute" : "Mute"}
          style={{ background: "none", border: "none", color: "var(--color-text-secondary)", cursor: "pointer", padding: "4px", display: "flex" }}
        >
          <Icon size={size} />
        </button>
        <input
          type="range" min={0} max={100} value={Math.round(effectiveVolume * 100)}
          onChange={(e) => setVolume(Number(e.target.value) / 100)}
          aria-label="Volume"
          style={{ width: "72px", cursor: "pointer", accentColor: "var(--color-accent)" }}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Volume"
        style={{
          width: "34px", height: "34px", borderRadius: "50%", flexShrink: 0,
          background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
          color: "var(--color-text-secondary)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <Icon size={size} />
      </button>

      {open && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
          background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)",
          borderRadius: "var(--radius-lg)", boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
          padding: "14px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
          zIndex: 40,
        }}>
          <input
            type="range" min={0} max={100} value={Math.round(effectiveVolume * 100)}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            style={{
              writingMode: "vertical-lr" as any, direction: "rtl",
              width: "20px", height: "90px", cursor: "pointer", accentColor: "var(--color-accent)",
            }}
          />
          <button
            onClick={toggleMute}
            style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: 0, fontSize: "11px" }}
          >
            {isMuted ? "Unmute" : "Mute"}
          </button>
        </div>
      )}
    </div>
  );
}
