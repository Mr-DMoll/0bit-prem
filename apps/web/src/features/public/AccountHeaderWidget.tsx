"use client";

import Link from "next/link";
import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/shared/context/AuthContext";
import { useToast } from "@/shared/context/ToastContext";

const AUTH_ERRORS: Record<string, string> = {
  google_denied:    "Google sign-in was cancelled.",
  google_no_email:  "Your Google account has no accessible email address.",
  suspended:        "Your account has been suspended.",
  not_found:        "Account not found.",
  oauth_failed:     "Google sign-in failed. Please try again.",
};

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

function AccountHeaderWidgetInner() {
  const { user, isLoading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  useEffect(() => {
    const code = searchParams.get("authError");
    if (!code) return;
    toast(AUTH_ERRORS[code] ?? "Sign-in failed. Please try again.");
    const params = new URLSearchParams(searchParams);
    params.delete("authError");
    router.replace(params.size ? `?${params.toString()}` : window.location.pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <button
        onClick={handleGoogleSignIn}
        style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "9px 18px 9px 14px", background: "transparent",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 600,
          color: "var(--color-text-primary)", cursor: "pointer", whiteSpace: "nowrap",
        }}
      >
        <GoogleIcon />
        Continue with Google
      </button>
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

export default function AccountHeaderWidget() {
  return (
    <Suspense fallback={null}>
      <AccountHeaderWidgetInner />
    </Suspense>
  );
}
