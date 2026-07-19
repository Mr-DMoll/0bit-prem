"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/features/public/PageHeader";
import EventCard from "@/features/public/EventCard";
import { publicEventsService, type PublicEvent } from "@/features/public/services/events.service";

export default function EventsPage() {
  const [events, setEvents]       = useState<PublicEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    publicEventsService.getEvents("GENERAL")
      .then((res) => setEvents(res.data?.events ?? []))
      .finally(() => setIsLoading(false));
  }, []);

  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.date).getTime() >= now);
  const past     = events.filter((e) => new Date(e.date).getTime() < now);

  return (
    <div>
      <PageHeader title="Events" />

      {isLoading ? (
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Loading…</p>
      ) : events.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>No events yet — check back soon.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {upcoming.length > 0 && (
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>Upcoming</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {upcoming.map((e) => <EventCard key={e.id} event={e} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>Past</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", opacity: 0.6 }}>
                {past.map((e) => <EventCard key={e.id} event={e} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
