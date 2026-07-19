"use client";

import { useState, useEffect, useCallback } from "react";
import { adminService, type TeamUser } from "../services/admin.service";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px",
  background: "var(--color-bg-subtle)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)", fontSize: "14px", color: "var(--color-text-primary)",
  outline: "none", boxSizing: "border-box",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

const focusBorder = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = "var(--color-accent)";
  e.target.style.boxShadow   = "0 0 0 3px var(--color-accent-subtle)";
};
const blurBorder = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = "var(--color-border)";
  e.target.style.boxShadow   = "none";
};

// ── Status badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, React.CSSProperties> = {
    ACTIVE:    { background: "var(--color-accent-subtle)",  color: "var(--color-accent)",  border: "1px solid var(--color-accent-border)"         },
    PENDING:   { background: "var(--color-warning-subtle)", color: "var(--color-warning)", border: "1px solid rgba(245,158,11,0.25)"               },
    SUSPENDED: { background: "var(--color-danger-subtle)",  color: "var(--color-danger)",  border: "1px solid rgba(239,68,68,0.25)"                },
  };
  const s = map[status] ?? map.PENDING;
  return (
    <span style={{ ...s, display: "inline-flex", alignItems: "center", padding: "2px 10px", borderRadius: "var(--radius-pill)", fontSize: "11px", fontWeight: 600 }}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ── Invite modal ───────────────────────────────────────────────────────────────

function InviteModal({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (email: string) => Promise<void>;
}) {
  const [email, setEmail]           = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true); setError(null);
    try { await onSubmit(email.trim().toLowerCase()); onClose(); }
    catch (err: any) { setError(err?.response?.data?.message ?? "Failed to send invite."); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{
        position: "relative", zIndex: 10, width: "100%", maxWidth: "440px",
        background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)",
        borderRadius: "var(--radius-xl)", padding: "28px",
        boxShadow: "var(--color-card-shadow)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Invite Customer</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "18px", lineHeight: 1 }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Email address
            </label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com" required autoFocus style={inputStyle}
              onFocus={focusBorder} onBlur={blurBorder}
            />
          </div>
          {error && (
            <div style={{ padding: "10px 14px", background: "var(--color-danger-subtle)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--color-danger)" }}>
              {error}
            </div>
          )}
          <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: 0 }}>
            An activation email will be sent. They will set their own password.
          </p>
          <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 500, color: "var(--color-text-secondary)", cursor: "pointer" }}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting || !email.trim()} style={{ flex: 1, padding: "10px", background: isSubmitting || !email.trim() ? "var(--color-accent-subtle)" : "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 700, color: "var(--color-accent-text)", cursor: isSubmitting || !email.trim() ? "not-allowed" : "pointer" }}>
              {isSubmitting ? "Sending..." : "Send Invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Confirm dialog ─────────────────────────────────────────────────────────────

function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onCancel }: {
  title: string; message: string; confirmLabel: string;
  danger?: boolean; onConfirm: () => Promise<void>; onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={onCancel} />
      <div style={{
        position: "relative", zIndex: 10, width: "100%", maxWidth: "360px",
        background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)",
        borderRadius: "var(--radius-lg)", padding: "24px",
        boxShadow: "var(--color-card-shadow)",
      }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 8px" }}>{title}</h3>
        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: "0 0 20px", lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "9px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "13px", fontWeight: 500, color: "var(--color-text-secondary)", cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={async () => { setBusy(true); await onConfirm(); setBusy(false); }}
            disabled={busy}
            style={{ flex: 1, padding: "9px", background: danger ? "var(--color-danger)" : "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)", fontSize: "13px", fontWeight: 700, color: "#fff", cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1 }}
          >
            {busy ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Customer row ───────────────────────────────────────────────────────────────

function CustomerRow({ user, onStatusChange, onPromote }: {
  user: TeamUser;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onPromote:      (id: string) => Promise<void>;
}) {
  const [confirm, setConfirm] = useState<"suspend" | "activate" | "promote" | null>(null);
  const [hovered, setHovered] = useState(false);

  const displayName =
    user.displayName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.email;
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      <tr
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          borderBottom: "1px solid var(--color-border)",
          background: hovered ? "var(--color-bg-subtle)" : "transparent",
          transition: "background 0.1s",
        }}
      >
        <td style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--color-accent-subtle)", border: "1px solid var(--color-accent-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-accent)" }}>{initials}</span>
            </div>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", margin: 0, lineHeight: 1.2 }}>{displayName}</p>
              {displayName !== user.email && (
                <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: "2px 0 0" }}>{user.email}</p>
              )}
            </div>
          </div>
        </td>
        <td style={{ padding: "14px 16px" }}><StatusBadge status={user.accountStatus} /></td>
        <td style={{ padding: "14px 16px", fontSize: "13px", color: "var(--color-text-muted)" }}>
          {new Date(user.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
        </td>
        <td style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {user.accountStatus === "ACTIVE" && (
              <button onClick={() => setConfirm("suspend")} style={{ padding: "4px 10px", fontSize: "12px", fontWeight: 500, color: "var(--color-warning)", background: "var(--color-warning-subtle)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "var(--radius-sm)", cursor: "pointer" }}>
                Suspend
              </button>
            )}
            {user.accountStatus === "SUSPENDED" && (
              <button onClick={() => setConfirm("activate")} style={{ padding: "4px 10px", fontSize: "12px", fontWeight: 500, color: "var(--color-accent)", background: "var(--color-accent-subtle)", border: "1px solid var(--color-accent-border)", borderRadius: "var(--radius-sm)", cursor: "pointer" }}>
                Activate
              </button>
            )}
            {user.accountStatus === "ACTIVE" && (
              <button onClick={() => setConfirm("promote")} style={{ padding: "4px 10px", fontSize: "12px", fontWeight: 500, color: "var(--color-info)", background: "var(--color-info-subtle)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: "var(--radius-sm)", cursor: "pointer" }}>
                → Manager
              </button>
            )}
          </div>
        </td>
      </tr>

      {confirm === "suspend"  && <ConfirmDialog title="Suspend customer?"     message={`${displayName} will lose access immediately.`}                       confirmLabel="Suspend"  danger onConfirm={async () => { await onStatusChange(user.id, "SUSPENDED"); setConfirm(null); }} onCancel={() => setConfirm(null)} />}
      {confirm === "activate" && <ConfirmDialog title="Activate customer?"    message={`${displayName} will regain full access.`}                            confirmLabel="Activate"       onConfirm={async () => { await onStatusChange(user.id, "ACTIVE");    setConfirm(null); }} onCancel={() => setConfirm(null)} />}
      {confirm === "promote"  && <ConfirmDialog title="Promote to manager?"   message={`${displayName} will become a manager and move to the Managers list.`} confirmLabel="Promote"        onConfirm={async () => { await onPromote(user.id); setConfirm(null); }} onCancel={() => setConfirm(null)} />}
    </>
  );
}

// ── CUSTOMERS PAGE ──────────────────────────────────────────────────────────────
// Customers only (role: USER) — Managers live entirely on their own page now,
// so there's no tab here that can accidentally mix the two lists together.

export function CustomersPage() {
  const [users,      setUsers]      = useState<TeamUser[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true); setError(null);
      const res = await adminService.getUsers({ role: "USER" });
      setUsers(res.data?.users ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load customers.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleStatusChange = async (id: string, status: string) => {
    await adminService.updateUserStatus(id, status);
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, accountStatus: status } : u));
  };

  const handlePromote = async (id: string) => {
    await adminService.updateUserRole(id, "MANAGER");
    // Promoted accounts belong on the Managers page now, not here.
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleInvite = async (email: string) => {
    await adminService.inviteUser(email);
    await fetchUsers();
  };

  const activeCount    = users.filter((u) => u.accountStatus === "ACTIVE").length;
  const pendingCount   = users.filter((u) => u.accountStatus === "PENDING").length;
  const suspendedCount = users.filter((u) => u.accountStatus === "SUSPENDED").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 4px" }}>Customers</h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: 0 }}>Everyone who buys music or merch — managers live on their own page</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          style={{ padding: "9px 16px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)", fontSize: "13px", fontWeight: 700, color: "var(--color-accent-text)", cursor: "pointer" }}
        >
          + Invite Customer
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        {[
          { label: "Active",    count: activeCount,    color: "var(--color-accent)",  subtle: "var(--color-accent-subtle)"  },
          { label: "Pending",   count: pendingCount,   color: "var(--color-warning)", subtle: "var(--color-warning-subtle)" },
          { label: "Suspended", count: suspendedCount, color: "var(--color-danger)",  subtle: "var(--color-danger-subtle)"  },
        ].map(({ label, count, color, subtle }) => (
          <div key={label} style={{ background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-lg)", padding: "20px", boxShadow: "var(--color-card-shadow)" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "var(--radius-md)", background: subtle, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color }} />
            </div>
            <p style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 4px", lineHeight: 1 }}>{count}</p>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: 0 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--color-card-shadow)" }}>
        {isLoading ? (
          <div style={{ padding: "48px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            <div style={{ width: "18px", height: "18px", borderRadius: "50%", border: "2px solid var(--color-border)", borderTopColor: "var(--color-accent)", animation: "spin 0.7s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Loading...</span>
          </div>
        ) : error ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: "var(--color-danger)", margin: 0 }}>{error}</p>
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: "56px", textAlign: "center" }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 4px" }}>No customers yet</p>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "0 0 20px" }}>Invite customers to get started</p>
            <button onClick={() => setShowInvite(true)} style={{ padding: "9px 18px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)", fontSize: "13px", fontWeight: 700, color: "var(--color-accent-text)", cursor: "pointer" }}>
              Invite first customer
            </button>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border)" }}>
                {["Customer", "Status", "Joined", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <CustomerRow key={u.id} user={u} onStatusChange={handleStatusChange} onPromote={handlePromote} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onSubmit={handleInvite} />}
    </div>
  );
}
