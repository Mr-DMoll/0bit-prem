"use client";

import { useRef } from "react";
import { Bold, Italic, Heading2, List, ListOrdered, Quote, Link as LinkIcon } from "lucide-react";
import { marked } from "marked";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  minHeight?: string;
  placeholder?: string;
}

const toolbarBtnStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center",
  width: "28px", height: "28px", borderRadius: "var(--radius-sm)",
  background: "none", border: "none", color: "var(--color-text-secondary)", cursor: "pointer",
};

const paneLabelStyle: React.CSSProperties = {
  padding: "8px 14px", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)",
  textTransform: "uppercase", letterSpacing: "0.06em",
  borderBottom: "1px solid var(--color-border)",
};

// A lightweight formatting toolbar over a plain textarea — inserts/wraps
// markdown syntax rather than editing HTML, so the stored value stays plain
// markdown and the public site's existing `marked`-based renderer needs no
// changes. Editor and preview sit side by side (rather than a tab toggle) so
// the wide admin canvas is actually used, and formatting is visible live as
// you type. Preview colors follow this (light, indigo) admin theme, not the
// public site's amber theme — that's expected, this is the admin UI.
export default function MarkdownEditor({ value, onChange, minHeight = "220px", placeholder }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyWrap = (before: string, after: string, placeholderText: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const hasSelection = end > start;
    const middle = hasSelection ? value.slice(start, end) : placeholderText;
    const newValue = value.slice(0, start) + before + middle + after + value.slice(end);
    onChange(newValue);
    requestAnimationFrame(() => {
      el.focus();
      const from = start + before.length;
      el.setSelectionRange(from, from + middle.length);
    });
  };

  const applyLinePrefix = (prefix: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const newValue = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    onChange(newValue);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length);
    });
  };

  const tools: { icon: React.ReactNode; title: string; onClick: () => void }[] = [
    { icon: <Bold size={14} />,        title: "Bold",           onClick: () => applyWrap("**", "**", "bold text") },
    { icon: <Italic size={14} />,      title: "Italic",         onClick: () => applyWrap("*", "*", "italic text") },
    { icon: <Heading2 size={14} />,    title: "Heading",        onClick: () => applyLinePrefix("## ") },
    { icon: <List size={14} />,        title: "Bullet list",    onClick: () => applyLinePrefix("- ") },
    { icon: <ListOrdered size={14} />, title: "Numbered list",  onClick: () => applyLinePrefix("1. ") },
    { icon: <Quote size={14} />,       title: "Quote",          onClick: () => applyLinePrefix("> ") },
    { icon: <LinkIcon size={14} />,    title: "Link",           onClick: () => applyWrap("[", "](https://)", "link text") },
  ];

  return (
    <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "2px",
        padding: "6px 8px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border)",
      }}>
        {tools.map((t) => (
          <button
            key={t.title}
            type="button"
            title={t.title}
            aria-label={t.title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={t.onClick}
            style={toolbarBtnStyle}
          >
            {t.icon}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "stretch" }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", borderRight: "1px solid var(--color-border)" }}>
          <div style={paneLabelStyle}>Markdown</div>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{
              flex: 1, width: "100%", minHeight, padding: "14px", border: "none", outline: "none",
              resize: "vertical", fontSize: "14px", lineHeight: 1.6, fontFamily: "inherit",
              color: "var(--color-text-primary)", background: "var(--color-card-bg)", boxSizing: "border-box",
              display: "block",
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div style={paneLabelStyle}>Preview</div>
          <div
            className="pk-markdown"
            style={{ flex: 1, minHeight, maxHeight: "60vh", overflowY: "auto", padding: "14px", fontSize: "14px", color: "var(--color-text-secondary)", boxSizing: "border-box" }}
            dangerouslySetInnerHTML={{
              __html: value
                ? (marked.parse(value, { async: false }) as string)
                : `<p style="color:var(--color-text-muted)">Nothing to preview yet.</p>`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
