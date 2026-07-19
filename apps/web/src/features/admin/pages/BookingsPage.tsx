"use client";

import { useState, useEffect, useCallback } from "react";
import { bookingsService, type BookingInquiryItem } from "../services/bookings.service";

const STATUS_OPTIONS = ["NEW", "CONTACTED", "CONFIRMED", "DECLINED", "ARCHIVED"] as const;

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    NEW:       { background: "var(--color-info-subtle)",    color: "var(--color-info)" },
    CONTACTED: { background: "var(--color-warning-subtle)", color: "var(--color-warning)" },
    CONFIRMED: { background: "var(--color-success-subtle)", color: "var(--color-success)" },
    DECLINED:  { background: "var(--color-danger-subtle)",  color: "var(--color-danger)" },
    ARCHIVED:  { background: "var(--color-bg-subtle)",      color: "var(--color-text-muted)" },
  };
  return (
    <span style={{ ...(styles[status] ?? styles.NEW), display: "inline-flex", padding: "3px 10px", borderRadius: "var(--radius-pill)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
      {status}
    </span>
  );
}

export function BookingsPage() {
  const [inquiries, setInquiries] = useState<BookingInquiryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const fetchInquiries = useCallback(async () => {
    try {
      setIsLoading(true); setError(null);
      const res = await bookingsService.getInquiries();
      setInquiries(res.data?.inquiries ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load bookings.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchInquiries(); }, [fetchInquiries]);

  const handleStatusChange = async (id: string, status: string) => {
    await bookingsService.updateStatus(id, status);
    await fetchInquiries();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>Bookings</h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>Booking inquiries submitted via the Contact page</p>
      </div>

      <div style={{ background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-xl)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "14px" }}>Loading…</div>
        ) : error ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--color-danger)", fontSize: "14px" }}>{error}</div>
        ) : inquiries.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "14px" }}>No inquiries yet</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["From", "Event details", "Received", "Status"].map((h) => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", background: "var(--color-bg-subtle)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inq) => (
                <tr key={inq.id} style={{ borderBottom: "1px solid var(--color-border)", verticalAlign: "top" }}>
                  <td style={{ padding: "14px 20px" }}>
                    <p style={{ margin: 0, fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-primary)" }}>{inq.name}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--color-text-muted)" }}>{inq.email}</p>
                    {inq.phone && <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--color-text-muted)" }}>{inq.phone}</p>}
                  </td>
                  <td style={{ padding: "14px 20px", maxWidth: "320px" }}>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-secondary)" }}>{inq.eventDetails}</p>
                    {inq.message && <p style={{ margin: "6px 0 0", fontSize: "12px", color: "var(--color-text-muted)", fontStyle: "italic" }}>{inq.message}</p>}
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: "13px", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                    {new Date(inq.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <StatusBadge status={inq.status} />
                      <select
                        value={inq.status}
                        onChange={(e) => handleStatusChange(inq.id, e.target.value)}
                        style={{
                          padding: "5px 8px", fontSize: "12px", background: "var(--color-bg-subtle)",
                          border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)",
                          color: "var(--color-text-primary)",
                        }}
                      >
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
