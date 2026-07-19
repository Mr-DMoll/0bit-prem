"use client";

import { useState, useEffect, useMemo } from "react";
import PageHeader from "@/features/public/PageHeader";
import EventCard from "@/features/public/EventCard";
import MarkdownContent, { extractHeadings } from "@/features/public/MarkdownContent";
import TableOfContents from "@/features/public/TableOfContents";
import { publicEventsService, type PublicEvent } from "@/features/public/services/events.service";
import { publicContentService } from "@/features/public/services/content.service";

const TABS = ["Teachings", "Events"] as const;
type Tab = typeof TABS[number];

export default function HarinamPage() {
  const [events, setEvents]       = useState<PublicEvent[]>([]);
  const [intro, setIntro]         = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab]             = useState<Tab>("Teachings");

  useEffect(() => {
    Promise.all([
      publicEventsService.getEvents("HARINAM"),
      publicContentService.getContent(),
    ]).then(([eventsRes, contentRes]) => {
      setEvents(eventsRes.data?.events ?? []);
      setIntro(contentRes.data?.content?.harinam_intro ?? "");
    }).finally(() => setIsLoading(false));
  }, []);

  const headings = useMemo(() => extractHeadings(intro), [intro]);

  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.date).getTime() >= now);
  const past     = events.filter((e) => new Date(e.date).getTime() < now);

  const tabsNav = (
    <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid var(--color-border)" }}>
      {TABS.map((t) => (
        <button
          key={t}
          onClick={() => setTab(t)}
          style={{
            padding: "10px 16px", background: "none", border: "none",
            borderBottom: tab === t ? "2px solid var(--color-accent)" : "2px solid transparent",
            fontSize: "13.5px", fontWeight: 600,
            color: tab === t ? "var(--color-accent)" : "var(--color-text-muted)",
            cursor: "pointer",
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <PageHeader title="Harinam" tabs={tabsNav} />

      {isLoading ? (
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Loading…</p>
      ) : tab === "Teachings" ? (
        intro ? (
          <div className="pk-toc-layout">
            <TableOfContents headings={headings} />
            <MarkdownContent markdown={intro} maxWidth="1000px" />
          </div>
        ) : (
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Content coming soon.</p>
        )
      ) : events.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>No Harinam programs scheduled yet — check back soon.</p>
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
