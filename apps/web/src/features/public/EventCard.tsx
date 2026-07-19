import Link from "next/link";
import type { PublicEvent } from "./services/events.service";

export default function EventCard({ event }: { event: PublicEvent }) {
  return (
    <Link href={`/events/${event.id}`} style={{ textDecoration: "none", display: "block" }}>
      <div style={{
        display: "flex", gap: "16px", padding: "16px",
        background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)",
        borderRadius: "var(--radius-lg)",
      }}>
        <div style={{
          width: "72px", height: "72px", borderRadius: "var(--radius-md)", flexShrink: 0,
          background: event.imageUrl ? `url(${event.imageUrl}) center/cover` : "linear-gradient(135deg, hsl(38,65%,22%), hsl(16,50%,8%))",
          border: "1px solid var(--color-border)",
        }} />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)" }}>{event.title}</p>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--color-text-muted)" }}>
            {event.venue}{event.city ? `, ${event.city}` : ""} — {new Date(event.date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
          </p>
          {event.description && <p style={{ margin: "6px 0 0", fontSize: "13px", color: "var(--color-text-secondary)" }}>{event.description}</p>}
          <span style={{
            display: "inline-block", marginTop: "10px", fontSize: "12px", fontWeight: 700,
            color: "var(--color-accent)",
          }}>
            View details →
          </span>
        </div>
      </div>
    </Link>
  );
}
