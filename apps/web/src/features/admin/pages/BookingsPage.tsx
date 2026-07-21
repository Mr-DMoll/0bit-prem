"use client";

import { Fragment, useState, useEffect, useCallback, useMemo } from "react";
import { ChevronDown, ChevronUp, AlertTriangle, Send, Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { bookingsService, type BookingInquiryItem, type BookingEventTypeOption } from "../services/bookings.service";
import { useToast } from "@/shared/context/ToastContext";

const STATUS_OPTIONS = ["NEW", "CONTACTED", "CONFIRMED", "DECLINED", "ARCHIVED"] as const;

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", background: "var(--color-bg-subtle)",
  border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
  fontSize: "13px", color: "var(--color-text-primary)", outline: "none",
  boxSizing: "border-box", fontFamily: "inherit",
};

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

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function ExpandedDetail({
  inquiry, onNotesSaved, onReplySent,
}: {
  inquiry: BookingInquiryItem;
  onNotesSaved: (id: string, notes: string) => Promise<void>;
  onReplySent: (id: string) => Promise<void>;
}) {
  const toast = useToast();
  const [notes, setNotes] = useState(inquiry.internalNotes ?? "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await onNotesSaved(inquiry.id, notes);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setIsSendingReply(true);
    try {
      await bookingsService.reply(inquiry.id, replyText.trim());
      setReplyText("");
      await onReplySent(inquiry.id);
    } catch (err: any) {
      toast(err?.response?.data?.message ?? "Failed to send reply.");
    } finally {
      setIsSendingReply(false);
    }
  };

  return (
    <div style={{ padding: "18px 20px", background: "var(--color-bg-subtle)", display: "flex", flexDirection: "column", gap: "18px" }}>
      {(inquiry.eventDetails || inquiry.message) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {inquiry.eventDetails && (
            <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-secondary)" }}>
              <strong style={{ color: "var(--color-text-primary)" }}>Additional details:</strong> {inquiry.eventDetails}
            </p>
          )}
          {inquiry.message && (
            <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-secondary)", fontStyle: "italic" }}>
              <strong style={{ color: "var(--color-text-primary)", fontStyle: "normal" }}>Message:</strong> {inquiry.message}
            </p>
          )}
        </div>
      )}

      <div>
        <p style={{ margin: "0 0 6px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Internal notes</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Private — only staff can see this (e.g. 'spoke on the phone, waiting on deposit')"
          style={{ ...inputStyle, resize: "vertical", minHeight: "60px" }}
        />
        <button
          onClick={handleSaveNotes}
          disabled={isSavingNotes || notes === (inquiry.internalNotes ?? "")}
          style={{
            marginTop: "6px", padding: "6px 14px", fontSize: "12px", fontWeight: 600,
            background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)",
            color: "var(--color-text-secondary)", cursor: (isSavingNotes || notes === (inquiry.internalNotes ?? "")) ? "not-allowed" : "pointer",
          }}
        >
          {isSavingNotes ? "Saving…" : "Save notes"}
        </button>
      </div>

      <div>
        <p style={{ margin: "0 0 8px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Replies {inquiry.replies.length > 0 && `(${inquiry.replies.length})`}
        </p>
        {inquiry.replies.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "10px" }}>
            {inquiry.replies.map((r) => (
              <div key={r.id} style={{ padding: "10px 12px", background: "var(--color-card-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)" }}>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-primary)", whiteSpace: "pre-wrap" }}>{r.message}</p>
                <p style={{ margin: "6px 0 0", fontSize: "11px", color: "var(--color-text-muted)" }}>{r.sentByEmail} · {formatDate(r.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply to ${inquiry.name}…`}
            style={{ ...inputStyle, resize: "vertical", minHeight: "50px", flex: 1 }}
          />
          <button
            onClick={handleSendReply}
            disabled={isSendingReply || !replyText.trim()}
            style={{
              display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px",
              background: (isSendingReply || !replyText.trim()) ? "var(--color-accent-subtle)" : "var(--color-accent)",
              border: "none", borderRadius: "var(--radius-md)", fontSize: "13px", fontWeight: 600,
              color: (isSendingReply || !replyText.trim()) ? "var(--color-accent)" : "var(--color-accent-text)",
              cursor: (isSendingReply || !replyText.trim()) ? "not-allowed" : "pointer", flexShrink: 0,
            }}
          >
            <Send size={13} /> {isSendingReply ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EventTypeRow({
  eventType, onRenamed, onToggled, onDeleted,
}: {
  eventType: BookingEventTypeOption;
  onRenamed: (id: string, label: string) => Promise<void>;
  onToggled: (id: string, isEnabled: boolean) => Promise<void>;
  onDeleted: (id: string) => Promise<void>;
}) {
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(eventType.label);
  const [isBusy, setIsBusy] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleToggle = async () => {
    setIsBusy(true);
    try {
      await onToggled(eventType.id, !eventType.isEnabled);
    } catch (err: any) {
      toast(err?.response?.data?.message ?? "Failed to update.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveRename = async () => {
    const trimmed = draftLabel.trim();
    if (!trimmed || trimmed === eventType.label) { setIsEditing(false); setDraftLabel(eventType.label); return; }
    setIsBusy(true);
    try {
      await onRenamed(eventType.id, trimmed);
      setIsEditing(false);
    } catch (err: any) {
      toast(err?.response?.data?.message ?? "Failed to rename.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsBusy(true);
    try {
      await onDeleted(eventType.id);
    } catch (err: any) {
      toast(err?.response?.data?.message ?? "Failed to delete.");
      setIsBusy(false);
      setIsConfirmingDelete(false);
    }
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px",
      borderRadius: "var(--radius-md)", background: eventType.isEnabled ? "var(--color-bg-subtle)" : "transparent",
    }}>
      <input type="checkbox" checked={eventType.isEnabled} disabled={isBusy} onChange={handleToggle} style={{ width: "16px", height: "16px", cursor: "pointer", flexShrink: 0 }} />

      {isConfirmingDelete ? (
        <>
          <span style={{ flex: 1, fontSize: "13px", color: "var(--color-text-secondary)" }}>
            Delete <strong style={{ color: "var(--color-text-primary)" }}>{eventType.label}</strong>? Past inquiries keep their record.
          </span>
          <button
            onClick={handleConfirmDelete}
            disabled={isBusy}
            style={{
              padding: "6px 12px", fontSize: "12px", fontWeight: 700, flexShrink: 0,
              background: "var(--color-danger)", border: "none", borderRadius: "var(--radius-sm)",
              color: "white", cursor: isBusy ? "not-allowed" : "pointer",
            }}
          >
            {isBusy ? "Deleting…" : "Delete"}
          </button>
          <button onClick={() => setIsConfirmingDelete(false)} disabled={isBusy} title="Cancel" style={iconButtonStyle}><X size={15} /></button>
        </>
      ) : isEditing ? (
        <>
          <input
            autoFocus
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSaveRename(); if (e.key === "Escape") { setIsEditing(false); setDraftLabel(eventType.label); } }}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={handleSaveRename} disabled={isBusy} title="Save" style={iconButtonStyle}><Check size={15} /></button>
          <button onClick={() => { setIsEditing(false); setDraftLabel(eventType.label); }} disabled={isBusy} title="Cancel" style={iconButtonStyle}><X size={15} /></button>
        </>
      ) : (
        <>
          <span style={{ flex: 1, fontSize: "13.5px", fontWeight: 600, color: eventType.isEnabled ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
            {eventType.label}
          </span>
          <button onClick={() => setIsEditing(true)} disabled={isBusy} title="Rename" style={iconButtonStyle}><Pencil size={14} /></button>
          <button onClick={() => setIsConfirmingDelete(true)} disabled={isBusy} title="Delete" style={{ ...iconButtonStyle, color: "var(--color-danger)" }}><Trash2 size={14} /></button>
        </>
      )}
    </div>
  );
}

const iconButtonStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", flexShrink: 0,
  background: "none", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)",
  color: "var(--color-text-secondary)", cursor: "pointer",
};

function BookingSettingsTab() {
  const toast = useToast();
  const [eventTypes, setEventTypes] = useState<BookingEventTypeOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const fetchEventTypes = useCallback(async () => {
    const res = await bookingsService.listEventTypes();
    setEventTypes(res.data?.eventTypes ?? []);
  }, []);

  useEffect(() => {
    fetchEventTypes().finally(() => setIsLoading(false));
  }, [fetchEventTypes]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const label = newLabel.trim();
    if (!label) return;
    setIsAdding(true);
    try {
      await bookingsService.createEventType(label);
      setNewLabel("");
      await fetchEventTypes();
    } catch (err: any) {
      toast(err?.response?.data?.message ?? "Failed to add event type.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRename = async (id: string, label: string) => {
    await bookingsService.updateEventType(id, { label });
    await fetchEventTypes();
  };

  const handleToggle = async (id: string, isEnabled: boolean) => {
    await bookingsService.updateEventType(id, { isEnabled });
    await fetchEventTypes();
  };

  const handleDelete = async (id: string) => {
    await bookingsService.deleteEventType(id);
    await fetchEventTypes();
  };

  if (isLoading) {
    return <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "14px" }}>Loading…</div>;
  }

  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "20px", maxWidth: "560px" }}>
      <div>
        <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)" }}>Event types offered</h3>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
          Add, rename, or remove the event types customers can pick from on the booking form. Unchecked types stay in this list but won't appear publicly.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {eventTypes.map((et) => (
          <EventTypeRow key={et.id} eventType={et} onRenamed={handleRename} onToggled={handleToggle} onDeleted={handleDelete} />
        ))}
      </div>

      <form onSubmit={handleAdd} style={{ display: "flex", gap: "8px" }}>
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="e.g. Harinam"
          style={{ ...inputStyle, flex: 1 }}
        />
        <button
          type="submit"
          disabled={isAdding || !newLabel.trim()}
          style={{
            display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", flexShrink: 0,
            background: (isAdding || !newLabel.trim()) ? "var(--color-accent-subtle)" : "var(--color-accent)",
            border: "none", borderRadius: "var(--radius-md)", fontSize: "13px", fontWeight: 600,
            color: (isAdding || !newLabel.trim()) ? "var(--color-accent)" : "var(--color-accent-text)",
            cursor: (isAdding || !newLabel.trim()) ? "not-allowed" : "pointer",
          }}
        >
          <Plus size={14} /> Add
        </button>
      </form>
    </div>
  );
}

export function BookingsPage() {
  const [tab, setTab] = useState<"inquiries" | "settings">("inquiries");
  const [inquiries, setInquiries] = useState<BookingInquiryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [sortBy, setSortBy]       = useState<"received" | "eventDate">("received");
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const handleNotesSaved = async (id: string, internalNotes: string) => {
    await bookingsService.updateNotes(id, internalNotes);
    await fetchInquiries();
  };

  // Confirmed bookings sharing a date with another inquiry are a real
  // scheduling conflict — surfaced inline rather than requiring a full
  // calendar view.
  const confirmedDates = useMemo(() => {
    const set = new Set<string>();
    inquiries.forEach((i) => { if (i.status === "CONFIRMED" && i.eventDate) set.add(i.eventDate.slice(0, 10)); });
    return set;
  }, [inquiries]);

  const hasConflict = (inquiry: BookingInquiryItem) => {
    if (!inquiry.eventDate || inquiry.status === "CONFIRMED") return false;
    return confirmedDates.has(inquiry.eventDate.slice(0, 10));
  };

  const sortedInquiries = useMemo(() => {
    const list = inquiries.slice();
    if (sortBy === "eventDate") {
      list.sort((a, b) => {
        if (!a.eventDate && !b.eventDate) return 0;
        if (!a.eventDate) return 1;
        if (!b.eventDate) return -1;
        return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
      });
    }
    return list;
  }, [inquiries, sortBy]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>Bookings</h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>Booking inquiries submitted via the Contact page</p>
        </div>
        {tab === "inquiries" && (
          <div style={{ display: "flex", gap: "4px" }}>
            {(["received", "eventDate"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                style={{
                  padding: "7px 14px", borderRadius: "var(--radius-pill)", fontSize: "12.5px", fontWeight: 600, cursor: "pointer",
                  border: sortBy === s ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                  background: sortBy === s ? "var(--color-accent-subtle)" : "var(--color-bg-subtle)",
                  color: sortBy === s ? "var(--color-accent)" : "var(--color-text-secondary)",
                }}
              >
                Sort by {s === "received" ? "received" : "event date"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid var(--color-border)" }}>
        {([
          { key: "inquiries", label: "Inquiries" },
          { key: "settings",  label: "Settings" },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 16px", fontSize: "13.5px", fontWeight: 600, cursor: "pointer",
              background: "none", border: "none", borderBottom: tab === t.key ? "2px solid var(--color-accent)" : "2px solid transparent",
              color: tab === t.key ? "var(--color-accent)" : "var(--color-text-muted)", marginBottom: "-1px",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-xl)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        {tab === "settings" ? (
          <BookingSettingsTab />
        ) : isLoading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "14px" }}>Loading…</div>
        ) : error ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--color-danger)", fontSize: "14px" }}>{error}</div>
        ) : inquiries.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "14px" }}>No inquiries yet</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["From", "Event", "Date", "Received", "Status", ""].map((h) => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", background: "var(--color-bg-subtle)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedInquiries.map((inq) => {
                const isExpanded = expandedId === inq.id;
                const conflict = hasConflict(inq);
                return (
                  <Fragment key={inq.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : inq.id)}
                      style={{ borderBottom: isExpanded ? "none" : "1px solid var(--color-border)", verticalAlign: "top", cursor: "pointer" }}
                    >
                      <td style={{ padding: "14px 20px" }}>
                        <p style={{ margin: 0, fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-primary)" }}>{inq.name}</p>
                        <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--color-text-muted)" }}>{inq.email}</p>
                        {inq.phone && <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--color-text-muted)" }}>{inq.phone}</p>}
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", color: "var(--color-text-secondary)" }}>
                        <p style={{ margin: 0, fontWeight: 600, color: "var(--color-text-primary)" }}>{inq.eventType ?? "—"}</p>
                        {inq.venue && <p style={{ margin: "2px 0 0" }}>{inq.venue}</p>}
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                        {formatDate(inq.eventDate)}
                        {conflict && (
                          <span title="Conflicts with a confirmed booking on this date" style={{ display: "inline-flex", alignItems: "center", gap: "3px", marginLeft: "6px", color: "var(--color-warning)", fontSize: "11px", fontWeight: 700 }}>
                            <AlertTriangle size={12} /> conflict
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                        {formatDate(inq.createdAt)}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }} onClick={(e) => e.stopPropagation()}>
                          <StatusBadge status={inq.status} />
                          <select
                            value={inq.status}
                            onChange={(e) => handleStatusChange(inq.id, e.target.value)}
                            style={{ padding: "5px 8px", fontSize: "12px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)" }}
                          >
                            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px", color: "var(--color-text-muted)" }}>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td colSpan={6} style={{ padding: 0 }}>
                          <ExpandedDetail inquiry={inq} onNotesSaved={handleNotesSaved} onReplySent={fetchInquiries} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
