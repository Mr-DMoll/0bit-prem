"use client";

import { useState, useEffect, useCallback } from "react";
import { contentService, type ContentMap } from "../services/content.service";
import MarkdownEditor from "../components/MarkdownEditor";

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

const ALL_KEYS: (keyof ContentMap)[] = [
  "about_bio", "harinam_intro", "sanctum_quote", "contact_email", "contact_phone", "contact_socials",
];

const TABS = ["About", "Harinam", "Sanctum", "Contact"] as const;
type Tab = typeof TABS[number];

function tabBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: "10px 16px", background: "none", border: "none",
    borderBottom: active ? "2px solid var(--color-accent)" : "2px solid transparent",
    fontSize: "13.5px", fontWeight: 600,
    color: active ? "var(--color-accent)" : "var(--color-text-muted)",
    cursor: "pointer",
  };
}

export function ContentPage() {
  const [content, setContent]     = useState<ContentMap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving]   = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [tab, setTab]             = useState<Tab>("About");

  const fetchContent = useCallback(async () => {
    try {
      setIsLoading(true); setError(null);
      const res = await contentService.getContent();
      setContent(res.data?.content ?? null);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load content.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  const handleChange = (key: keyof ContentMap, value: string) => {
    setContent((c) => (c ? { ...c, [key]: value } : c));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!content) return;
    setIsSaving(true); setError(null);
    try {
      await Promise.all(ALL_KEYS.map((key) => contentService.updateContent(key, content[key] ?? "")));
      setSaved(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to save content.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading…</div>;
  if (!content) return <div style={{ padding: "60px", textAlign: "center", color: "var(--color-danger)" }}>{error ?? "Failed to load."}</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>Content</h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>Text shown on the About, Contact, Harinam, and Sanctum pages</p>
      </div>

      <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid var(--color-border)" }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={tabBtnStyle(tab === t)}>
            {t}
          </button>
        ))}
      </div>

      <div style={{
        background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)",
        borderRadius: "var(--radius-xl)", boxShadow: "var(--color-card-shadow)", padding: "28px",
        display: "flex", flexDirection: "column", gap: "20px", width: "100%",
      }}>
        {tab === "About" && (
          <div>
            <label style={labelStyle}>Bio</label>
            <MarkdownEditor
              value={content.about_bio}
              onChange={(v) => handleChange("about_bio", v)}
              minHeight="260px"
              placeholder="Tell fans who Premvkay is…"
            />
          </div>
        )}

        {tab === "Harinam" && (
          <div>
            <label style={labelStyle}>Intro text</label>
            <MarkdownEditor
              value={content.harinam_intro}
              onChange={(v) => handleChange("harinam_intro", v)}
              minHeight="380px"
              placeholder="Reasons we chant, who Hari is, who Gauranga is…"
            />
          </div>
        )}

        {tab === "Sanctum" && (
          <div style={{ maxWidth: "560px" }}>
            <label style={labelStyle}>Quote (shown quietly under the player; leave blank to hide)</label>
            <input
              style={inputStyle}
              value={content.sanctum_quote}
              onChange={(e) => handleChange("sanctum_quote", e.target.value)}
            />
          </div>
        )}

        {tab === "Contact" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "560px" }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                style={inputStyle}
                value={content.contact_email}
                onChange={(e) => handleChange("contact_email", e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input
                style={inputStyle}
                value={content.contact_phone}
                onChange={(e) => handleChange("contact_phone", e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Socials (free text, e.g. &quot;Instagram: @premvkay, YouTube: /premvkay&quot;)</label>
              <textarea
                style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }}
                value={content.contact_socials}
                onChange={(e) => handleChange("contact_socials", e.target.value)}
              />
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding: "10px 14px", background: "var(--color-danger-subtle)", border: "1px solid var(--color-danger)", borderRadius: "var(--radius-md)", fontSize: "13px", color: "var(--color-danger)" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: "10px 20px", background: isSaving ? "var(--color-accent-subtle)" : "var(--color-accent)",
              border: "none", borderRadius: "var(--radius-md)", fontSize: "13.5px", fontWeight: 600,
              color: isSaving ? "var(--color-accent)" : "var(--color-accent-text)",
              cursor: isSaving ? "not-allowed" : "pointer",
            }}
          >
            {isSaving ? "Saving…" : "Save changes"}
          </button>
          {saved && !isSaving && (
            <span style={{ fontSize: "13px", color: "var(--color-success)" }}>Saved</span>
          )}
        </div>
      </div>
    </div>
  );
}
