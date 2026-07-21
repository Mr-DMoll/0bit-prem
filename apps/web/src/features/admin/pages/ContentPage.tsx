"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { ExternalLink, RotateCcw, Globe } from "lucide-react";
import { contentService, type ContentMap, type ContentMeta } from "../services/content.service";
import MarkdownEditor from "../components/MarkdownEditor";
import { InstagramIcon, YoutubeIcon, FacebookIcon, XIcon } from "@/shared/components/SocialIcons";

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

const TABS = ["About", "Harinam", "Sanctum", "Contact"] as const;
type Tab = typeof TABS[number];

const TAB_KEYS: Record<Tab, (keyof ContentMap)[]> = {
  About:   ["about_bio"],
  Harinam: ["harinam_intro"],
  Sanctum: ["sanctum_quote"],
  Contact: ["contact_email", "contact_phone", "contact_social_instagram", "contact_social_youtube", "contact_social_facebook", "contact_social_x", "contact_social_website"],
};

const VIEW_LIVE_HREF: Record<Tab, string> = {
  About: "/about", Harinam: "/harinam", Sanctum: "/", Contact: "/contact",
};

function tabBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: "10px 16px", background: "none", border: "none",
    borderBottom: active ? "2px solid var(--color-accent)" : "2px solid transparent",
    fontSize: "13.5px", fontWeight: 600,
    color: active ? "var(--color-accent)" : "var(--color-text-muted)",
    cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
  };
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function FieldMeta({ metaEntry, onRevert }: { metaEntry?: { updatedAt: string; hasPrevious: boolean }; onRevert: () => void }) {
  if (!metaEntry) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
      <span style={{ fontSize: "11.5px", color: "var(--color-text-muted)" }}>Last saved {timeAgo(metaEntry.updatedAt)}</span>
      {metaEntry.hasPrevious && (
        <button
          type="button"
          onClick={onRevert}
          style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", padding: 0, fontSize: "11.5px", fontWeight: 600, color: "var(--color-accent)", cursor: "pointer" }}
        >
          <RotateCcw size={11} /> Revert to previous
        </button>
      )}
    </div>
  );
}

function ViewLiveLink({ href }: { href: string }) {
  return (
    <Link href={href} target="_blank" style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12.5px", fontWeight: 600, color: "var(--color-text-secondary)", textDecoration: "none" }}>
      View live <ExternalLink size={12} />
    </Link>
  );
}

export function ContentPage() {
  const [content, setContent]     = useState<ContentMap | null>(null);
  const [meta, setMeta]            = useState<ContentMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving]   = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [tab, setTab]             = useState<Tab>("About");
  const [dirtyKeys, setDirtyKeys] = useState<Set<keyof ContentMap>>(new Set());

  const fetchContent = useCallback(async () => {
    try {
      setIsLoading(true); setError(null);
      const res = await contentService.getContent();
      setContent(res.data?.content ?? null);
      setMeta(res.data?.meta ?? null);
      setDirtyKeys(new Set());
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load content.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  // Warn on tab close/refresh/navigating to a new URL while there are
  // unsaved edits — doesn't cover in-app SPA navigation (clicking another
  // sidebar link), which would need intercepting Next's router directly,
  // but this covers the common "accidentally closed the tab" case.
  useEffect(() => {
    if (dirtyKeys.size === 0) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirtyKeys]);

  const handleChange = (key: keyof ContentMap, value: string) => {
    setContent((c) => (c ? { ...c, [key]: value } : c));
    setDirtyKeys((prev) => new Set(prev).add(key));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!content || dirtyKeys.size === 0) return;
    setIsSaving(true); setError(null);
    try {
      const keys = Array.from(dirtyKeys);
      const results = await Promise.all(keys.map((key) => contentService.updateContent(key, content[key] ?? "")));
      setMeta((prev) => {
        const next = { ...(prev ?? {}) } as ContentMeta;
        keys.forEach((key, i) => { next[key] = results[i].data.meta; });
        return next;
      });
      setDirtyKeys(new Set());
      setSaved(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to save content.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevert = async (key: keyof ContentMap) => {
    const res = await contentService.revertContent(key);
    setContent((c) => (c ? { ...c, [key]: res.data.setting.value } : c));
    setMeta((prev) => (prev ? { ...prev, [key]: res.data.meta } : prev));
    setDirtyKeys((prev) => { const next = new Set(prev); next.delete(key); return next; });
  };

  const tabIsDirty = useMemo(() => {
    const map: Record<Tab, boolean> = { About: false, Harinam: false, Sanctum: false, Contact: false };
    for (const t of TABS) map[t] = TAB_KEYS[t].some((k) => dirtyKeys.has(k));
    return map;
  }, [dirtyKeys]);

  if (isLoading) return <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading…</div>;
  if (!content) return <div style={{ padding: "60px", textAlign: "center", color: "var(--color-danger)" }}>{error ?? "Failed to load."}</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>Content</h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>Text shown on the About, Contact, Harinam, and Sanctum pages</p>
        </div>
        <ViewLiveLink href={VIEW_LIVE_HREF[tab]} />
      </div>

      <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid var(--color-border)" }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={tabBtnStyle(tab === t)}>
            {t}
            {tabIsDirty[t] && (
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-warning)" }} />
            )}
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
            <FieldMeta metaEntry={meta?.about_bio} onRevert={() => handleRevert("about_bio")} />
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
            <FieldMeta metaEntry={meta?.harinam_intro} onRevert={() => handleRevert("harinam_intro")} />
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
            <FieldMeta metaEntry={meta?.sanctum_quote} onRevert={() => handleRevert("sanctum_quote")} />
          </div>
        )}

        {tab === "Contact" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "560px" }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} value={content.contact_email} onChange={(e) => handleChange("contact_email", e.target.value)} />
              <FieldMeta metaEntry={meta?.contact_email} onRevert={() => handleRevert("contact_email")} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input style={inputStyle} value={content.contact_phone} onChange={(e) => handleChange("contact_phone", e.target.value)} />
              <FieldMeta metaEntry={meta?.contact_phone} onRevert={() => handleRevert("contact_phone")} />
            </div>

            <div>
              <label style={labelStyle}>Socials</label>
              <p style={{ margin: "0 0 12px", fontSize: "12px", color: "var(--color-text-muted)" }}>
                Leave any of these blank to hide that icon on the public Contact page.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {([
                  { key: "contact_social_instagram" as const, icon: <InstagramIcon size={15} />, placeholder: "https://instagram.com/premvkay" },
                  { key: "contact_social_youtube" as const,    icon: <YoutubeIcon size={15} />,   placeholder: "https://youtube.com/@premvkay" },
                  { key: "contact_social_facebook" as const,   icon: <FacebookIcon size={15} />,  placeholder: "https://facebook.com/premvkay" },
                  { key: "contact_social_x" as const,          icon: <XIcon size={15} />,          placeholder: "https://x.com/premvkay" },
                  { key: "contact_social_website" as const,    icon: <Globe size={15} />,          placeholder: "https://premvkay.com" },
                ]).map(({ key, icon, placeholder }) => (
                  <div key={key}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "34px", height: "34px", flexShrink: 0, borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}>
                        {icon}
                      </div>
                      <input
                        style={inputStyle}
                        placeholder={placeholder}
                        value={content[key]}
                        onChange={(e) => handleChange(key, e.target.value)}
                      />
                    </div>
                    <FieldMeta metaEntry={meta?.[key]} onRevert={() => handleRevert(key)} />
                  </div>
                ))}
              </div>
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
            disabled={isSaving || dirtyKeys.size === 0}
            style={{
              padding: "10px 20px",
              background: (isSaving || dirtyKeys.size === 0) ? "var(--color-accent-subtle)" : "var(--color-accent)",
              border: "none", borderRadius: "var(--radius-md)", fontSize: "13.5px", fontWeight: 600,
              color: (isSaving || dirtyKeys.size === 0) ? "var(--color-accent)" : "var(--color-accent-text)",
              cursor: (isSaving || dirtyKeys.size === 0) ? "not-allowed" : "pointer",
            }}
          >
            {isSaving ? "Saving…" : dirtyKeys.size > 0 ? `Save changes (${dirtyKeys.size})` : "Save changes"}
          </button>
          {saved && !isSaving && (
            <span style={{ fontSize: "13px", color: "var(--color-success)" }}>Saved</span>
          )}
        </div>
      </div>
    </div>
  );
}
