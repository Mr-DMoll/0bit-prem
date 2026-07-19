"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowUp, ArrowDown, Plus, Trash2 } from "lucide-react";
import { galleryService, type GalleryImageItem } from "../services/gallery.service";
import { FileUploadField } from "../components/FileUploadField";
import { useConfirm } from "@/shared/context/ConfirmContext";
import { useToast } from "@/shared/context/ToastContext";

const inputStyle: React.CSSProperties = {
  padding: "9px 12px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)", fontSize: "13.5px", color: "var(--color-text-primary)",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};

function AddImageRow({ onSubmit }: { onSubmit: (input: { url: string; caption?: string }) => Promise<void> }) {
  const [url, setUrl]         = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy]       = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setBusy(true);
    try {
      await onSubmit({ url: url.trim(), caption: caption.trim() || undefined });
      setUrl(""); setCaption("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px 20px", background: "var(--color-bg-subtle)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "12px", alignItems: "start" }}>
        <FileUploadField value={url} onChange={setUrl} accept="image/*" folder="gallery" />
        <input style={{ ...inputStyle, alignSelf: "center" }} placeholder="Caption (optional)" value={caption} onChange={(e) => setCaption(e.target.value)} />
      </div>
      <button type="submit" disabled={busy || !url} style={{
        alignSelf: "flex-start",
        padding: "9px 14px", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-md)",
        fontSize: "12.5px", fontWeight: 600, color: "var(--color-accent-text)", cursor: (busy || !url) ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
      }}>
        <Plus size={13} /> Add
      </button>
    </form>
  );
}

export function GalleryPage() {
  const confirm = useConfirm();
  const toast = useToast();
  const [images, setImages]       = useState<GalleryImageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    try {
      setIsLoading(true); setError(null);
      const res = await galleryService.getImages();
      setImages((res.data?.images ?? []).slice().sort((a, b) => a.order - b.order));
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load gallery.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchImages(); }, [fetchImages]);

  const handleAdd = async (input: { url: string; caption?: string }) => { await galleryService.createImage(input); await fetchImages(); };
  const handleDelete = async (id: string) => {
    if (!(await confirm({ message: "Delete this image?", danger: true }))) return;
    try {
      await galleryService.deleteImage(id);
      await fetchImages();
    } catch (err: any) {
      toast(err?.response?.data?.message ?? "Failed to delete image.");
    }
  };
  const handleReorder = async (id: string, direction: "up" | "down") => {
    const idx = images.findIndex((img) => img.id === id);
    const swapWithOrder = direction === "up" ? images[idx - 1]?.order : images[idx + 1]?.order;
    if (swapWithOrder === undefined) return;
    await galleryService.updateImage(id, { swapWithOrder });
    await fetchImages();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>Gallery</h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>Photos shown on the public Gallery page</p>
      </div>

      <div style={{ background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)", borderRadius: "var(--radius-xl)", boxShadow: "var(--color-card-shadow)", overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "14px" }}>Loading…</div>
        ) : error ? (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--color-danger)", fontSize: "14px" }}>{error}</div>
        ) : images.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13.5px" }}>No images yet — add one below.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "14px", padding: "20px" }}>
            {images.map((img, i) => (
              <div key={img.id} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{
                  aspectRatio: "1", borderRadius: "var(--radius-md)",
                  background: `url(${img.url}) center/cover`, border: "1px solid var(--color-border)",
                }} />
                {img.caption && <p style={{ margin: 0, fontSize: "12px", color: "var(--color-text-muted)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{img.caption}</p>}
                <div style={{ display: "flex", gap: "4px" }}>
                  <button disabled={i === 0} onClick={() => handleReorder(img.id, "up")} style={{ flex: 1, padding: "4px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", cursor: i === 0 ? "not-allowed" : "pointer", opacity: i === 0 ? 0.4 : 1 }}><ArrowUp size={12} /></button>
                  <button disabled={i === images.length - 1} onClick={() => handleReorder(img.id, "down")} style={{ flex: 1, padding: "4px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", cursor: i === images.length - 1 ? "not-allowed" : "pointer", opacity: i === images.length - 1 ? 0.4 : 1 }}><ArrowDown size={12} /></button>
                  <button onClick={() => handleDelete(img.id)} style={{ flex: 1, padding: "4px", background: "var(--color-danger-subtle)", border: "1px solid var(--color-danger-subtle)", borderRadius: "var(--radius-sm)", color: "var(--color-danger)", cursor: "pointer" }}><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
        <AddImageRow onSubmit={handleAdd} />
      </div>
    </div>
  );
}
