"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/shared/context/AuthContext";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px",
  background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--color-text-primary)",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};

function LoginPopover({ onClose }: { onClose: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
    window.location.href = `${apiBase}/auth/google`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true); setError(null);
    try {
      await login(email, password);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Invalid email or password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: "absolute", top: "calc(100% + 8px)", right: 0, width: "280px",
      background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)",
      borderRadius: "var(--radius-lg)", boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
      padding: "18px", zIndex: 30,
    }}>
      <button
        onClick={handleGoogleSignIn}
        style={{
          width: "100%", padding: "9px 14px", background: "var(--color-accent)", border: "none",
          borderRadius: "var(--radius-md)", fontSize: "13px", fontWeight: 700,
          color: "var(--color-accent-text)", cursor: "pointer",
        }}
      >
        Continue with Google
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "16px 0" }}>
        <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
        <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>or sign in with email</span>
        <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input
          type="email" placeholder="you@email.com" value={email}
          onChange={(e) => setEmail(e.target.value)} style={inputStyle} required autoFocus
        />
        <input
          type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)} style={inputStyle} required
        />
        {error && <p style={{ margin: 0, fontSize: "12px", color: "var(--color-danger)" }}>{error}</p>}
        <button
          type="submit" disabled={isSubmitting}
          style={{
            padding: "9px 14px", background: isSubmitting ? "var(--color-bg-subtle)" : "var(--color-bg-subtle)",
            border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
            fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)",
            cursor: isSubmitting ? "not-allowed" : "pointer",
          }}
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export default function AccountHeaderWidget() {
  const { user, isLoading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (isLoading) return null;

  if (!user) {
    return (
      <div ref={containerRef} style={{ position: "relative" }}>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            padding: "10px 22px", background: "var(--color-accent)", border: "none",
            borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 700,
            color: "var(--color-accent-text)", cursor: "pointer", whiteSpace: "nowrap",
          }}
        >
          Log in
        </button>
        {open && <LoginPopover onClose={() => setOpen(false)} />}
      </div>
    );
  }

  const displayName = user.displayName || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  const initials = displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: "10px", padding: "6px 14px 6px 6px",
          background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-pill)", cursor: "pointer", whiteSpace: "nowrap",
        }}
      >
        <div style={{
          width: "30px", height: "30px", borderRadius: "50%",
          background: user.avatarUrl ? "transparent" : "var(--color-accent-subtle)",
          border: "1px solid var(--color-accent-border)",
          display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0,
        }}>
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-accent)" }}>{initials}</span>
          )}
        </div>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>{displayName}</span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0, minWidth: "180px",
          background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)",
          borderRadius: "var(--radius-lg)", boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
          overflow: "hidden", zIndex: 30,
        }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--color-border)" }}>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>{displayName}</p>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--color-text-muted)" }}>{user.email}</p>
          </div>
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            style={{
              display: "block", padding: "10px 14px", fontSize: "13px", fontWeight: 500,
              color: "var(--color-text-secondary)", textDecoration: "none",
            }}
          >
            Profile
          </Link>
          <button
            onClick={() => { setOpen(false); logout(); }}
            style={{
              display: "block", width: "100%", textAlign: "left", padding: "10px 14px",
              fontSize: "13px", fontWeight: 500, color: "var(--color-danger)",
              background: "none", border: "none", borderTop: "1px solid var(--color-border)", cursor: "pointer",
            }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
