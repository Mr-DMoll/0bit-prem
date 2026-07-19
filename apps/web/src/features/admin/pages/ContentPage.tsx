"use client";

import { useState, useEffect, useCallback } from "react";
import { contentService, type ContentMap } from "../services/content.service";

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

const FIELDS: { key: keyof ContentMap; label: string; multiline?: boolean }[] = [
  { key: "about_bio", label: "About — Bio", multiline: true },
  { key: "harinam_intro", label: "Harinam — Intro text", multiline: true },
  { key: "sanctum_quote", label: "Sanctum — Quote (shown quietly under the player; leave blank to hide)" },
  { key: "contact_email", label: "Contact — Email" },
  { key: "contact_phone", label: "Contact — Phone" },
  { key: "contact_socials", label: "Contact — Socials (free text, e.g. \"Instagram: @premvkay, YouTube: /premvkay\")", multiline: true },
];

export function ContentPage() {
  const [content, setContent]     = useState<ContentMap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving]   = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState<string | null>(null);

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
      await Promise.all(FIELDS.map(({ key }) => contentService.updateContent(key, content[key] ?? "")));
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
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>Text shown on the About, Contact, and Harinam pages</p>
      </div>

      <div style={{
        background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)",
        borderRadius: "var(--radius-xl)", boxShadow: "var(--color-card-shadow)", padding: "28px",
        display: "flex", flexDirection: "column", gap: "20px", maxWidth: "640px",
      }}>
        {FIELDS.map(({ key, label, multiline }) => (
          <div key={key}>
            <label style={labelStyle}>{label}</label>
            {multiline ? (
              <textarea
                style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }}
                value={content[key]}
                onChange={(e) => handleChange(key, e.target.value)}
              />
            ) : (
              <input
                style={inputStyle}
                value={content[key]}
                onChange={(e) => handleChange(key, e.target.value)}
              />
            )}
          </div>
        ))}

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
