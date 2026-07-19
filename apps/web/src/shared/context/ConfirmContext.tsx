"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within a ConfirmProvider");
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    const normalized = typeof options === "string" ? { message: options } : options;
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setRequest(normalized);
    });
  }, []);

  const settle = (value: boolean) => {
    setRequest(null);
    resolveRef.current?.(value);
    resolveRef.current = null;
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }} onClick={() => settle(false)} />
          <div style={{
            position: "relative", zIndex: 10, width: "100%", maxWidth: "380px",
            background: "var(--color-card-bg)", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xl)", padding: "26px", boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "22px" }}>
              <div style={{
                width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: request.danger ? "var(--color-danger-subtle)" : "var(--color-accent-subtle)",
                color: request.danger ? "var(--color-danger)" : "var(--color-accent)",
              }}>
                <AlertTriangle size={18} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                  {request.title ?? (request.danger ? "Confirm deletion" : "Please confirm")}
                </h2>
                <p style={{ margin: "6px 0 0", fontSize: "13.5px", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                  {request.message}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button" onClick={() => settle(false)}
                style={{
                  flex: 1, padding: "10px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)", fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-secondary)", cursor: "pointer",
                }}
              >
                {request.cancelLabel ?? "Cancel"}
              </button>
              <button
                type="button" onClick={() => settle(true)} autoFocus
                style={{
                  flex: 1, padding: "10px", border: "none", borderRadius: "var(--radius-md)",
                  fontSize: "13.5px", fontWeight: 700, cursor: "pointer",
                  background: request.danger ? "var(--color-danger)" : "var(--color-accent)",
                  color: request.danger ? "var(--color-danger-text, #fff)" : "var(--color-accent-text)",
                }}
              >
                {request.confirmLabel ?? (request.danger ? "Delete" : "Confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
