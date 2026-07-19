"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { eventsService, type EventItem, type EventInput } from "../services/events.service";
import { FileUploadField } from "../components/FileUploadField";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px",
  background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)", fontSize: "14px", color: "var(--color-text-primary)",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)",
  marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em",
};

function toDateTimeLocal(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function EventModal({ event, onClose, onSubmit }: {
  event: EventItem | null;
  onClose: () => void;
  onSubmit: (input: EventInput) => Promise<void>;
}) {
  const [title, setTitle]             = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [venue, setVenue]             = useState(event?.venue ?? "");
  const [city, setCity]               = useState(event?.city ?? "");
  const [date, setDate]               = useState(toDateTimeLocal(event?.date));
  const [ticketUrl, setTicketUrl]     = useState(event?.ticketUrl ?? "");
  const [imageUrl, setImageUrl]       = useState(event?.imageUrl ?? "");
  const [category, setCategory]       = useState<"GENERAL" | "HARINAM">(event?.category ?? "GENERAL");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !venue.trim() || !date) return;
    setIsSubmitting(true); setError(null);
    try {
      await onSubmit({
        title: title.trim(), venue: venue.trim(),
        description: description.trim() || undefined,
        city: city.trim() || undefined,
        date: new Date(date).toISOString(),
        ticketUrl: ticketUrl.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        category,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to save event.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{
        position: "relative", zIndex: 10, width: "100%", maxWidth: "480px",
        background: "var(--color-card-bg)", border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)", padding: "32px", boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{event ? "Edit Event" : "New Event"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", fontSize: "18px" }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Title</label>
            <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "60px" }} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={labelStyle}>Venue</label>
              <input style={inputStyle} value={venue} onChange={(e) => setVenue(e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>City</label>
              <input style={inputStyle} value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={labelStyle}>Date & time</label>
              <input style={inputStyle} type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select style={inputStyle} value={category} onChange={(e) => setCategory(e.target.value as "GENERAL" | "HARINAM")}>
                <option value="GENERAL">General</option>
                <option value="HARINAM">Harinam</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Ticket URL</label>
            <input style={inputStyle} value={ticketUrl} onChange={(e) => setTicketUrl(e.target.value)} placeholder="https://…" />
          </div>
          <FileUploadField
            label="Image"
            value={imageUrl}
            onChange={setImageUrl}
            accept="image/*"
            folder="events"
          />

          {error && (
            <div style={{ padding: "10px 14px", background: "var(--color-danger-subtle)", border: "1px solid var(--color-danger)", borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--color-danger)" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "14px", color: "var(--color-text-secondary)", cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={isSubmitting} style={{
              flex: 1, padding: "10px",
              background: isSubmitting ? "var(--color-accent-subtle)" : "var(--color-accent)",
              border: "none", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 600,
              color: isSubmitting ? "var(--color-accent)" : "var(--color-accent-text)",
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}>
              {isSubmitting ? "Saving…" : event ? "Save changes" : "Create event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EventsPage() {
  const [events, setEvents]       = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [modalEvent, setModalEvent] = useState<EventItem | null | "new">(null);

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true); setError(null);
      const res = await eventsService.getEvents();
      setEvents(res.data?.events ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load events.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleCreate = async (input: EventInput) => { await eventsService.createEvent(input); await fetchEvents(); };
  const handleUpdate = async (id: string, input: EventInput) => { await eventsService.updateEvent(id, input); await fetchEvents(); };
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    await eventsService.deleteEvent(id);
    await fetchEvents();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>Events</h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>Upcoming and past events</p>
        </div>
        <button onClick={() => setModalEvent("new")} style={{
          display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px",
          background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)",
          fontSize: "13.5px", fontWeight: 600, color: "var(--color-accent-text)", cursor: "pointer",
        }}>
          <Plus size={15} /> New Event
        </button>
      </div>

      <div style={{ background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-xl)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "14px" }}>Loading…</div>
        ) : error ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--color-danger)", fontSize: "14px" }}>{error}</div>
        ) : events.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center" }}>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "8px" }}>No events yet</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {["Event", "Category", "Venue", "Date", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", background: "var(--color-bg-subtle)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "14px 20px", fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-primary)" }}>{event.title}</td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{
                      display: "inline-flex", padding: "3px 10px", borderRadius: "var(--radius-pill)",
                      fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
                      background: event.category === "HARINAM" ? "var(--color-accent-subtle)" : "var(--color-bg-subtle)",
                      color: event.category === "HARINAM" ? "var(--color-accent)" : "var(--color-text-muted)",
                    }}>
                      {event.category === "HARINAM" ? "Harinam" : "General"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: "13px", color: "var(--color-text-muted)" }}>{event.venue}{event.city ? `, ${event.city}` : ""}</td>
                  <td style={{ padding: "14px 20px", fontSize: "13px", color: "var(--color-text-muted)" }}>
                    {new Date(event.date).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => setModalEvent(event)} style={{ padding: "4px 12px", fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", cursor: "pointer" }}>Edit</button>
                      <button onClick={() => handleDelete(event.id)} style={{ padding: "4px 12px", fontSize: "12px", fontWeight: 600, color: "var(--color-danger)", background: "var(--color-danger-subtle)", border: "1px solid var(--color-danger-subtle)", borderRadius: "var(--radius-md)", cursor: "pointer" }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalEvent && (
        <EventModal
          event={modalEvent === "new" ? null : modalEvent}
          onClose={() => setModalEvent(null)}
          onSubmit={(input) => modalEvent === "new" ? handleCreate(input) : handleUpdate((modalEvent as EventItem).id, input)}
        />
      )}
    </div>
  );
}
