"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useAuth } from "@/shared/context/AuthContext";
import type { PublicTrack } from "./services/music.service";

function handleGoogleSignIn() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
  window.location.href = `${apiBase}/auth/google`;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}

export default function LockedTrackPrompt({ track, onClose, onBuy }: { track: PublicTrack; onClose: () => void; onBuy?: () => void }) {
  const { user } = useAuth();

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{
        position: "relative", zIndex: 10, width: "100%", maxWidth: "360px",
        background: "var(--color-card-bg)", border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)", padding: "30px 28px", boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
        textAlign: "center", boxSizing: "border-box",
      }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "50%", margin: "0 auto 16px",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--color-accent-subtle)", color: "var(--color-accent)",
        }}>
          <Lock size={18} />
        </div>
        <h2 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>
          {track.title}
        </h2>
        <p style={{ margin: "0 0 22px", fontSize: "13.5px", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
          {user
            ? `Buy ${track.albumTitle ?? "the album"} to unlock this track and the rest of the album.`
            : "Sign in to start your collection — then buy the album to unlock this track."}
        </p>

        {user && onBuy ? (
          <button
            onClick={() => { onBuy(); onClose(); }}
            style={{
              width: "100%", padding: "11px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)",
              fontSize: "14px", fontWeight: 700, color: "var(--color-accent-text)", cursor: "pointer",
            }}
          >
            Buy album
          </button>
        ) : user ? (
          <Link
            href={track.albumId ? `/music/${track.albumId}` : "/music"}
            onClick={onClose}
            style={{
              display: "block", padding: "11px", background: "var(--color-accent)", borderRadius: "var(--radius-md)",
              fontSize: "14px", fontWeight: 700, color: "var(--color-accent-text)", textDecoration: "none",
            }}
          >
            View album
          </Link>
        ) : (
          <button
            onClick={handleGoogleSignIn}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              padding: "11px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", cursor: "pointer",
            }}
          >
            <GoogleIcon /> Continue with Google
          </button>
        )}

        <button
          onClick={onClose}
          style={{ display: "block", width: "100%", marginTop: "12px", background: "none", border: "none", fontSize: "12.5px", color: "var(--color-text-muted)", cursor: "pointer" }}
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
