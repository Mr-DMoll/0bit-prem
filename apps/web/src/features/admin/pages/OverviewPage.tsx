"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminService, type DashboardStats } from "../services/admin.service";

function formatCents(cents: number) {
  return `ZAR ${(cents / 100).toFixed(2)}`;
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function displayName(u: { displayName?: string | null; firstName?: string | null; lastName?: string | null; email: string }) {
  return u.displayName || [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;
}

const ACTIVITY_LABELS: Record<string, string> = {
  LOGIN: "logged in",
  LOGIN_GOOGLE: "logged in with Google",
  REGISTERED: "registered",
  REGISTERED_GOOGLE: "registered with Google",
  PASSWORD_CHANGED: "changed their password",
  PASSWORD_RESET: "reset their password",
  PASSWORD_SET: "set their password",
  USER_INVITED: "invited a new user",
  MANAGER_INVITED: "invited a new manager",
};

function KpiTile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "up" | "down" }) {
  return (
    <div style={{
      background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)",
      borderRadius: "var(--radius-xl)", boxShadow: "var(--color-card-shadow)",
      padding: "20px 22px", display: "flex", flexDirection: "column", gap: "6px",
    }}>
      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </span>
      <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
        {value}
      </span>
      {sub && (
        <span style={{ fontSize: "12.5px", color: tone === "up" ? "var(--color-success)" : tone === "down" ? "var(--color-danger)" : "var(--color-text-muted)" }}>
          {sub}
        </span>
      )}
    </div>
  );
}

export function AdminOverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminService.getDashboard()
      .then((res) => setStats(res.data))
      .catch((err) => setError(err?.response?.data?.message ?? "Failed to load dashboard."))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 600, color: "var(--color-text-primary)" }}>Overview</h1>
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "4px" }}>
          Premvkay at a glance
        </p>
      </div>

      {isLoading ? (
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Loading…</p>
      ) : error || !stats ? (
        <p style={{ fontSize: "13px", color: "var(--color-danger)" }}>{error ?? "No data."}</p>
      ) : (
        <>
          {/* KPI row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <KpiTile
              label="Revenue this month"
              value={formatCents(stats.revenue.thisMonthCents)}
              sub={
                stats.revenue.lastMonthCents === 0
                  ? `${formatCents(stats.revenue.allTimeCents)} all-time`
                  : `${stats.revenue.thisMonthCents >= stats.revenue.lastMonthCents ? "▲" : "▼"} vs ${formatCents(stats.revenue.lastMonthCents)} last month · ${formatCents(stats.revenue.allTimeCents)} all-time`
              }
              tone={stats.revenue.thisMonthCents >= stats.revenue.lastMonthCents ? "up" : "down"}
            />
            <KpiTile
              label="Orders awaiting fulfillment"
              value={String(stats.ordersAwaitingFulfillment)}
              sub={stats.ordersAwaitingFulfillment > 0 ? "needs action" : "all caught up"}
            />
            <KpiTile
              label="New booking inquiries"
              value={String(stats.newBookingInquiries)}
              sub={stats.newBookingInquiries > 0 ? "needs a reply" : "all caught up"}
            />
            <KpiTile
              label="Customers"
              value={String(stats.activeUsers)}
              sub={`+${stats.newUsersThisWeek} this week`}
              tone={stats.newUsersThisWeek > 0 ? "up" : undefined}
            />
          </div>

          {/* Needs attention + activity */}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "16px", alignItems: "start" }}>
            <div style={{
              background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)",
              borderRadius: "var(--radius-xl)", boxShadow: "var(--color-card-shadow)", overflow: "hidden",
            }}>
              <div style={{ padding: "16px 20px 12px" }}>
                <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Needs attention</h2>
              </div>
              {stats.needsAttention.length === 0 ? (
                <p style={{ padding: "0 20px 20px", fontSize: "13px", color: "var(--color-text-muted)" }}>
                  Nothing waiting on you right now.
                </p>
              ) : (
                <div>
                  {stats.needsAttention.map((item) => (
                    <Link
                      key={`${item.type}-${item.id}`}
                      href={item.href}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
                        padding: "12px 20px", borderTop: "1px solid var(--color-border)",
                        textDecoration: "none",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.label}
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "var(--color-text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.subLabel}
                        </p>
                      </div>
                      <span style={{ fontSize: "11.5px", color: "var(--color-text-muted)", flexShrink: 0 }}>
                        {timeAgo(item.createdAt)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{
                background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)",
                borderRadius: "var(--radius-xl)", boxShadow: "var(--color-card-shadow)", overflow: "hidden",
              }}>
                <div style={{ padding: "16px 20px 12px" }}>
                  <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Recent activity</h2>
                </div>
                {stats.recentActivity.length === 0 ? (
                  <p style={{ padding: "0 20px 20px", fontSize: "13px", color: "var(--color-text-muted)" }}>Nothing yet.</p>
                ) : (
                  stats.recentActivity.map((a) => (
                    <div key={a.id} style={{ padding: "10px 20px", borderTop: "1px solid var(--color-border)" }}>
                      <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-secondary)" }}>
                        <strong style={{ color: "var(--color-text-primary)" }}>{a.user ? displayName(a.user) : "Someone"}</strong>{" "}
                        {ACTIVITY_LABELS[a.action] ?? a.action.replace(/_/g, " ").toLowerCase()}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: "var(--color-text-muted)" }}>{timeAgo(a.createdAt)}</p>
                    </div>
                  ))
                )}
              </div>

              <div style={{
                background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)",
                borderRadius: "var(--radius-xl)", boxShadow: "var(--color-card-shadow)", overflow: "hidden",
              }}>
                <div style={{ padding: "16px 20px 12px" }}>
                  <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Recent signups</h2>
                </div>
                {stats.recentSignups.length === 0 ? (
                  <p style={{ padding: "0 20px 20px", fontSize: "13px", color: "var(--color-text-muted)" }}>Nothing yet.</p>
                ) : (
                  stats.recentSignups.map((u) => (
                    <div key={u.id} style={{ padding: "10px 20px", borderTop: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "13px", color: "var(--color-text-primary)" }}>{displayName(u)}</span>
                      <span style={{ fontSize: "11.5px", color: "var(--color-text-muted)" }}>{timeAgo(u.createdAt)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
