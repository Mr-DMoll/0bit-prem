"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Search, Plus, UploadCloud, Pencil, FolderInput, Trash2, X, Check, Images, LayoutGrid } from "lucide-react";
import { galleryService, type GalleryImageItem, type GalleryAlbumItem } from "../services/gallery.service";
import { uploadsService } from "../services/uploads.service";
import { useConfirm } from "@/shared/context/ConfirmContext";
import { useToast } from "@/shared/context/ToastContext";

const inputStyle: React.CSSProperties = {
  padding: "9px 12px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)", fontSize: "13.5px", color: "var(--color-text-primary)",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)",
  marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em",
};

interface StagedUpload {
  key: string;
  file: File;
  progress: number;
  status: "uploading" | "error";
}

// ── Edit photo modal (caption + album) ─────────────────────────────────────────

function EditPhotoModal({
  image, albums, onClose, onSave,
}: {
  image: GalleryImageItem;
  albums: GalleryAlbumItem[];
  onClose: () => void;
  onSave: (input: { caption?: string; albumId: string | null }) => Promise<void>;
}) {
  const [caption, setCaption] = useState(image.caption ?? "");
  const [albumId, setAlbumId] = useState<string>(image.albumId ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({ caption: caption.trim(), albumId: albumId || null });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{
        position: "relative", zIndex: 10, width: "100%", maxWidth: "420px",
        background: "var(--color-card-bg)", border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-xl)", padding: "28px", boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Edit photo</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}><X size={18} /></button>
        </div>

        <div style={{
          aspectRatio: "16/10", borderRadius: "var(--radius-md)", marginBottom: "16px",
          background: `url(${image.url}) center/cover`, border: "1px solid var(--color-border)",
        }} />

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Caption</label>
            <input style={inputStyle} value={caption} onChange={(e) => setCaption(e.target.value)} autoFocus />
          </div>
          <div>
            <label style={labelStyle}>Album</label>
            <select style={{ ...inputStyle, width: "100%" }} value={albumId} onChange={(e) => setAlbumId(e.target.value)}>
              <option value="">Uncategorized</option>
              {albums.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "13.5px", color: "var(--color-text-secondary)", cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={isSaving} style={{
              flex: 1, padding: "10px", background: isSaving ? "var(--color-accent-subtle)" : "var(--color-accent)",
              border: "none", borderRadius: "var(--radius-md)", fontSize: "13.5px", fontWeight: 600,
              color: "var(--color-accent-text)", cursor: isSaving ? "not-allowed" : "pointer",
            }}>
              {isSaving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Photo card ──────────────────────────────────────────────────────────────────

function PhotoCard({
  image, selectMode, isSelected, onToggleSelect, onEdit, onDelete,
  onDragStart, onDragOver, onDrop,
}: {
  image: GalleryImageItem;
  selectMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}) {
  return (
    <div
      draggable={!selectMode}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={() => selectMode && onToggleSelect()}
      style={{
        breakInside: "avoid", marginBottom: "16px", position: "relative",
        borderRadius: "var(--radius-lg)", overflow: "hidden",
        border: isSelected ? "2px solid var(--color-accent)" : "1px solid var(--color-card-border)",
        background: "var(--color-card-bg)", cursor: selectMode ? "pointer" : "grab",
      }}
      className="gallery-photo-card"
    >
      <div style={{ position: "relative" }}>
        <img
          src={image.url}
          alt={image.caption || "Premvkay gallery photo"}
          loading="lazy"
          style={{ width: "100%", display: "block" }}
        />

        {selectMode && (
          <div style={{
            position: "absolute", top: "10px", left: "10px",
            width: "22px", height: "22px", borderRadius: "6px",
            background: isSelected ? "var(--color-accent)" : "rgba(0,0,0,0.45)",
            border: isSelected ? "none" : "1.5px solid rgba(255,255,255,0.8)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {isSelected && <Check size={14} color="var(--color-accent-text)" strokeWidth={3} />}
          </div>
        )}

        {!selectMode && (
          <div className="gallery-photo-actions" style={{
            position: "absolute", top: "8px", right: "8px", display: "flex", gap: "4px",
            opacity: 0, transition: "opacity 0.12s",
          }}>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              title="Edit"
              style={{ width: "28px", height: "28px", borderRadius: "7px", background: "rgba(0,0,0,0.55)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              title="Delete"
              style={{ width: "28px", height: "28px", borderRadius: "7px", background: "rgba(0,0,0,0.55)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {(image.caption || image.album) && (
        <div style={{ padding: "10px 12px" }}>
          {image.caption && <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>{image.caption}</p>}
          {image.album && (
            <span style={{
              display: "inline-block", marginTop: "6px", padding: "2px 9px",
              background: "var(--color-accent-subtle)", color: "var(--color-accent)",
              borderRadius: "var(--radius-pill)", fontSize: "11px", fontWeight: 600,
            }}>
              {image.album.name}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function GalleryPage() {
  const confirm = useConfirm();
  const toast = useToast();

  const [images, setImages]       = useState<GalleryImageItem[]>([]);
  const [albums, setAlbums]       = useState<GalleryAlbumItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const [activeAlbum, setActiveAlbum] = useState<string | null>(null); // null = All Photos, "none" = Uncategorized
  const [search, setSearch]           = useState("");
  const [selectMode, setSelectMode]   = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingImage, setEditingImage] = useState<GalleryImageItem | null>(null);
  const [newAlbumOpen, setNewAlbumOpen] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [staged, setStaged] = useState<StagedUpload[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragIndexRef = useRef<number | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setIsLoading(true); setError(null);
      const [imagesRes, albumsRes] = await Promise.all([
        galleryService.getImages(),
        galleryService.getAlbums(),
      ]);
      setImages((imagesRes.data?.images ?? []).slice().sort((a, b) => a.order - b.order));
      setAlbums(albumsRes.data?.albums ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load gallery.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const visibleImages = useMemo(() => {
    let list = images;
    if (activeAlbum === "none") list = list.filter((i) => !i.albumId);
    else if (activeAlbum) list = list.filter((i) => i.albumId === activeAlbum);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((i) => (i.caption ?? "").toLowerCase().includes(q));
    }
    return list;
  }, [images, activeAlbum, search]);

  const activeAlbumLabel =
    activeAlbum === "none" ? "Uncategorized" :
    activeAlbum ? albums.find((a) => a.id === activeAlbum)?.name ?? "Album" :
    "All Photos";

  // ── Upload ──────────────────────────────────────────────────────────────────

  const handleFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const entries: StagedUpload[] = files.map((file) => ({
      key: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
      file, progress: 0, status: "uploading",
    }));
    setStaged((prev) => [...prev, ...entries]);

    const results = await Promise.all(entries.map(async (entry) => {
      try {
        const url = await uploadsService.uploadWithProgress(entry.file, "gallery", (pct) => {
          setStaged((prev) => prev.map((s) => s.key === entry.key ? { ...s, progress: pct } : s));
        });
        return { url, ok: true as const };
      } catch {
        setStaged((prev) => prev.map((s) => s.key === entry.key ? { ...s, status: "error" as const } : s));
        return { ok: false as const };
      }
    }));

    const succeeded = results.filter((r): r is { url: string; ok: true } => r.ok);
    if (succeeded.length > 0) {
      const albumId = activeAlbum && activeAlbum !== "none" ? activeAlbum : undefined;
      await galleryService.bulkCreateImages(succeeded.map((r) => ({ url: r.url, albumId })));
      await fetchAll();
    }
    setStaged((prev) => prev.filter((s) => s.status === "error"));
  };

  // ── Reorder ─────────────────────────────────────────────────────────────────

  const handleDragStart = (index: number) => { dragIndexRef.current = index; };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (index: number) => {
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    if (from === null || from === index) return;

    const reordered = visibleImages.slice();
    const [moved] = reordered.splice(from, 1);
    reordered.splice(index, 0, moved);

    setImages((prev) => {
      const otherIds = new Set(reordered.map((i) => i.id));
      const others = prev.filter((i) => !otherIds.has(i.id));
      return [...reordered, ...others].sort((a, b) => {
        const ai = reordered.findIndex((i) => i.id === a.id);
        const bi = reordered.findIndex((i) => i.id === b.id);
        if (ai === -1 && bi === -1) return a.order - b.order;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
    });

    await galleryService.reorderImages(reordered.map((i) => i.id));
  };

  // ── Select mode / bulk actions ──────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (!(await confirm({ message: `Delete ${selectedIds.size} photo(s)? This cannot be undone.`, danger: true }))) return;
    await galleryService.bulkDeleteImages(Array.from(selectedIds));
    setSelectedIds(new Set());
    setSelectMode(false);
    await fetchAll();
  };

  const handleBulkMove = async (albumId: string) => {
    await galleryService.bulkMoveImages(Array.from(selectedIds), albumId || null);
    setSelectedIds(new Set());
    setSelectMode(false);
    await fetchAll();
  };

  // ── Single photo actions ────────────────────────────────────────────────────

  const handleEditSave = async (input: { caption?: string; albumId: string | null }) => {
    if (!editingImage) return;
    await galleryService.updateImage(editingImage.id, input);
    await fetchAll();
  };

  const handleDeleteOne = async (id: string) => {
    if (!(await confirm({ message: "Delete this photo?", danger: true }))) return;
    try {
      await galleryService.deleteImage(id);
      await fetchAll();
    } catch (err: any) {
      toast(err?.response?.data?.message ?? "Failed to delete photo.");
    }
  };

  // ── Albums ──────────────────────────────────────────────────────────────────

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumName.trim()) return;
    await galleryService.createAlbum(newAlbumName.trim());
    setNewAlbumName(""); setNewAlbumOpen(false);
    await fetchAll();
  };

  const uncategorizedCount = images.filter((i) => !i.albumId).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>Gallery</h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>Manage photos shown on your public Gallery page</p>
      </div>

      {/* Search + select */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "360px" }}>
          <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input
            placeholder="Search by caption…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, width: "100%", paddingLeft: "36px" }}
          />
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => { setSelectMode((v) => !v); setSelectedIds(new Set()); }}
          style={{
            display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px",
            background: selectMode ? "var(--color-accent)" : "var(--color-bg-subtle)",
            border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
            fontSize: "13px", fontWeight: 600,
            color: selectMode ? "var(--color-accent-text)" : "var(--color-text-secondary)",
            cursor: "pointer",
          }}
        >
          <Check size={14} /> {selectMode ? "Cancel" : "Select"}
        </button>
      </div>

      {/* Upload dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={(e) => {
          e.preventDefault(); setIsDraggingOver(false);
          if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
        }}
        style={{
          border: `2px dashed ${isDraggingOver ? "var(--color-accent)" : "var(--color-border)"}`,
          borderRadius: "var(--radius-lg)", padding: "28px", textAlign: "center",
          background: isDraggingOver ? "var(--color-accent-subtle)" : "var(--color-bg-subtle)",
          transition: "background 0.12s, border-color 0.12s",
        }}
      >
        <UploadCloud size={22} style={{ color: "var(--color-text-muted)", marginBottom: "8px" }} />
        <p style={{ margin: 0, fontSize: "13.5px", color: "var(--color-text-secondary)" }}>
          Drag & drop images here, or{" "}
          <button onClick={() => fileInputRef.current?.click()} style={{ background: "none", border: "none", padding: 0, color: "var(--color-accent)", fontWeight: 600, cursor: "pointer", fontSize: "inherit" }}>
            browse
          </button>
        </p>
        <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--color-text-muted)" }}>Multiple files supported</p>
        <input
          ref={fileInputRef} type="file" accept="image/*" multiple hidden
          onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ""; }}
        />
      </div>

      {staged.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {staged.map((s) => (
            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12.5px", color: "var(--color-text-muted)" }}>
              <span style={{ flexShrink: 0, minWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.file.name}</span>
              <div style={{ flex: 1, height: "4px", background: "var(--color-border)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ width: `${s.progress}%`, height: "100%", background: s.status === "error" ? "var(--color-danger)" : "var(--color-accent)", transition: "width 0.15s" }} />
              </div>
              <span>{s.status === "error" ? "Failed" : `${s.progress}%`}</span>
            </div>
          ))}
        </div>
      )}

      {/* Bulk action bar */}
      {selectMode && selectedIds.size > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px",
          background: "var(--color-accent-subtle)", border: "1px solid var(--color-accent-border)", borderRadius: "var(--radius-md)",
        }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-accent)" }}>{selectedIds.size} selected</span>
          <select
            defaultValue=""
            onChange={(e) => { if (e.target.value !== "__placeholder") handleBulkMove(e.target.value); e.target.value = ""; }}
            style={{ ...inputStyle, fontSize: "12.5px", padding: "6px 10px" }}
          >
            <option value="__placeholder" disabled>Move to album…</option>
            <option value="">Uncategorized</option>
            {albums.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <button onClick={handleBulkDelete} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", background: "var(--color-danger-subtle)", border: "1px solid var(--color-danger-subtle)", borderRadius: "var(--radius-sm)", fontSize: "12.5px", fontWeight: 600, color: "var(--color-danger)", cursor: "pointer" }}>
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}

      {/* Albums sidebar + grid */}
      <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
        <div style={{ width: "200px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px 6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Albums</span>
            <button onClick={() => setNewAlbumOpen((v) => !v)} title="New album" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
              <Plus size={15} />
            </button>
          </div>

          {newAlbumOpen && (
            <form onSubmit={handleCreateAlbum} style={{ display: "flex", gap: "6px", padding: "4px" }}>
              <input autoFocus value={newAlbumName} onChange={(e) => setNewAlbumName(e.target.value)} placeholder="Album name" style={{ ...inputStyle, flex: 1, fontSize: "12.5px", padding: "6px 8px" }} />
              <button type="submit" style={{ background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-sm)", width: "28px", color: "var(--color-accent-text)", cursor: "pointer" }}><Check size={13} /></button>
            </form>
          )}

          <button
            onClick={() => setActiveAlbum(null)}
            style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px",
              background: activeAlbum === null ? "var(--color-accent-subtle)" : "transparent",
              color: activeAlbum === null ? "var(--color-accent)" : "var(--color-text-secondary)",
              border: "none", borderRadius: "var(--radius-md)", fontSize: "13px", fontWeight: 600, cursor: "pointer", textAlign: "left",
            }}
          >
            <Images size={14} /> All Photos <span style={{ marginLeft: "auto", opacity: 0.7 }}>{images.length}</span>
          </button>

          {albums.map((a) => (
            <button
              key={a.id}
              onClick={() => setActiveAlbum(a.id)}
              style={{
                display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px",
                background: activeAlbum === a.id ? "var(--color-accent-subtle)" : "transparent",
                color: activeAlbum === a.id ? "var(--color-accent)" : "var(--color-text-secondary)",
                border: "none", borderRadius: "var(--radius-md)", fontSize: "13px", cursor: "pointer", textAlign: "left",
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
              <span style={{ marginLeft: "auto", opacity: 0.7, flexShrink: 0 }}>{a._count.images}</span>
            </button>
          ))}

          {uncategorizedCount > 0 && (
            <button
              onClick={() => setActiveAlbum("none")}
              style={{
                display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px",
                background: activeAlbum === "none" ? "var(--color-accent-subtle)" : "transparent",
                color: activeAlbum === "none" ? "var(--color-accent)" : "var(--color-text-muted)",
                border: "none", borderRadius: "var(--radius-md)", fontSize: "13px", cursor: "pointer", textAlign: "left",
              }}
            >
              <LayoutGrid size={14} /> Uncategorized <span style={{ marginLeft: "auto", opacity: 0.7 }}>{uncategorizedCount}</span>
            </button>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
              {activeAlbumLabel} · {visibleImages.length}
            </span>
            {visibleImages.length > 1 && !selectMode && (
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Drag to reorder</span>
            )}
          </div>

          {isLoading ? (
            <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "14px" }}>Loading…</div>
          ) : error ? (
            <div style={{ padding: "60px", textAlign: "center", color: "var(--color-danger)", fontSize: "14px" }}>{error}</div>
          ) : visibleImages.length === 0 ? (
            <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13.5px" }}>
              {search ? "No photos match your search." : "No photos here yet — drag some in above."}
            </div>
          ) : (
            <div style={{ columnWidth: "220px", columnGap: "16px" }}>
              {visibleImages.map((image, i) => (
                <PhotoCard
                  key={image.id}
                  image={image}
                  selectMode={selectMode}
                  isSelected={selectedIds.has(image.id)}
                  onToggleSelect={() => toggleSelect(image.id)}
                  onEdit={() => setEditingImage(image)}
                  onDelete={() => handleDeleteOne(image.id)}
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(i)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {editingImage && (
        <EditPhotoModal
          image={editingImage}
          albums={albums}
          onClose={() => setEditingImage(null)}
          onSave={handleEditSave}
        />
      )}

      <style>{`.gallery-photo-card:hover .gallery-photo-actions { opacity: 1 !important; }`}</style>
    </div>
  );
}
