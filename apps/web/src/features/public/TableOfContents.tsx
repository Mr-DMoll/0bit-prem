"use client";

import type { MarkdownHeading } from "./MarkdownContent";

export default function TableOfContents({ headings, topOffset = 24 }: { headings: MarkdownHeading[]; topOffset?: number }) {
  if (headings.length === 0) return null;

  const handleClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav style={{ position: "sticky", top: `${topOffset}px`, width: "220px", flexShrink: 0, alignSelf: "flex-start" }}>
      <p style={{ margin: "0 0 12px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        On this page
      </p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              onClick={(e) => handleClick(e, h.id)}
              style={{
                display: "block", padding: "6px 0", fontSize: "13px", lineHeight: 1.4,
                color: "var(--color-text-secondary)", textDecoration: "none",
                borderLeft: "2px solid transparent", paddingLeft: "10px",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-accent)"; e.currentTarget.style.borderLeftColor = "var(--color-accent)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-secondary)"; e.currentTarget.style.borderLeftColor = "transparent"; }}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
