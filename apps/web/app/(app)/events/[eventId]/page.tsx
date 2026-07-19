"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import PageHeader from "@/features/public/PageHeader";
import { publicEventsService, type PublicEvent } from "@/features/public/services/events.service";

export default function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const [event, setEvent]         = useState<PublicEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    publicEventsService.getEvent(eventId)
      .then((res) => setEvent(res.data?.event ?? null))
      .finally(() => setIsLoading(false));
  }, [eventId]);

  if (isLoading) return <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Loading…</p>;
  if (!event) return <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Event not found.</p>;

  const backHref = event.category === "HARINAM" ? "/harinam" : "/events";
  const backLabel = event.category === "HARINAM" ? "← Back to Harinam" : "← Back to Events";

  return (
    <div>
      <Link href={backHref} style={{ display: "inline-block", marginBottom: "16px", fontSize: "12.5px", fontWeight: 600, color: "var(--color-text-muted)", textDecoration: "none" }}>
        {backLabel}
      </Link>

      <PageHeader title={event.title} />

      <div style={{ display: "flex", gap: "32px", flexWrap: "wrap", maxWidth: "1000px" }}>
        <div style={{
          width: "100%", maxWidth: "460px", aspectRatio: "3/2", borderRadius: "var(--radius-lg)", flexShrink: 0,
          background: event.imageUrl ? `url(${event.imageUrl}) center/cover` : "linear-gradient(135deg, hsl(38,65%,22%), hsl(16,50%,8%))",
          border: "1px solid var(--color-card-border)",
        }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: "260px", flex: 1 }}>
          <div>
            <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "var(--color-text-primary)" }}>
              {event.venue}{event.city ? `, ${event.city}` : ""}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--color-accent)" }}>
              {new Date(event.date).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              {" · "}
              {new Date(event.date).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          {event.description && (
            <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.7, color: "var(--color-text-secondary)", maxWidth: "520px" }}>{event.description}</p>
          )}

          {event.ticketUrl && (
            <a
              href={event.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                alignSelf: "flex-start", padding: "12px 26px",
                background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)",
                fontSize: "14px", fontWeight: 700, color: "var(--color-accent-text)", textDecoration: "none",
              }}
            >
              Get Tickets →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
