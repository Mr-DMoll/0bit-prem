"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  variant: "error" | "success";
}

type ToastFn = (message: string, variant?: Toast["variant"]) => void;

const ToastContext = createContext<ToastFn | null>(null);

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
  }, []);

  const show = useCallback<ToastFn>((message, variant = "error") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, variant }]);
    timers.current.set(id, setTimeout(() => dismiss(id), 6000));
  }, [dismiss]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div style={{
        position: "fixed", bottom: "24px", right: "24px", zIndex: 300,
        display: "flex", flexDirection: "column", gap: "10px", maxWidth: "380px",
      }}>
        {toasts.map((t) => (
          <div key={t.id} style={{
            display: "flex", alignItems: "flex-start", gap: "10px", padding: "14px 16px",
            background: "var(--color-card-bg)", border: `1px solid ${t.variant === "error" ? "var(--color-danger)" : "var(--color-success)"}`,
            borderRadius: "var(--radius-lg)", boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
          }}>
            {t.variant === "error"
              ? <AlertCircle size={18} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: "1px" }} />
              : <CheckCircle2 size={18} color="var(--color-success)" style={{ flexShrink: 0, marginTop: "1px" }} />}
            <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-primary)", lineHeight: 1.5, flex: 1 }}>{t.message}</p>
            <button
              type="button" onClick={() => dismiss(t.id)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", flexShrink: 0 }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
