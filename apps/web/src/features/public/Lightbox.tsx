"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, Download, Share2 } from "lucide-react";
import { useToast } from "@/shared/context/ToastContext";

export interface LightboxImage {
  url: string;
  caption?: string | null;
}

interface LightboxProps {
  images: LightboxImage[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

const SWIPE_THRESHOLD = 50;

export default function Lightbox({ images, index, onClose, onIndexChange }: LightboxProps) {
  const toast = useToast();
  const touchStartX = useRef<number | null>(null);

  const goPrev = useCallback(() => onIndexChange((index - 1 + images.length) % images.length), [index, images.length, onIndexChange]);
  const goNext = useCallback(() => onIndexChange((index + 1) % images.length), [index, images.length, onIndexChange]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goPrev, goNext]);

  const current = images[index];
  if (!current) return null;

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (delta > SWIPE_THRESHOLD) goPrev();
    else if (delta < -SWIPE_THRESHOLD) goNext();
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(current.url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = current.url.split("/").pop() || "photo.jpg";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      toast("Couldn't download this photo. Please try again.");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: current.caption ?? "Premvkay", url: current.url });
      } catch {
        // User cancelled the share sheet — not an error.
      }
    } else {
      try {
        await navigator.clipboard.writeText(current.url);
        toast("Photo link copied to clipboard.");
      } catch {
        toast("Couldn't copy the link. Please try again.");
      }
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.92)" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div style={{ position: "absolute", top: "20px", right: "24px", display: "flex", gap: "10px" }}>
        <button
          onClick={handleShare}
          aria-label="Share"
          style={{
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.16)",
            borderRadius: "50%", width: "40px", height: "40px",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", cursor: "pointer",
          }}
        >
          <Share2 size={17} />
        </button>
        <button
          onClick={handleDownload}
          aria-label="Download"
          style={{
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.16)",
            borderRadius: "50%", width: "40px", height: "40px",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", cursor: "pointer",
          }}
        >
          <Download size={17} />
        </button>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.16)",
            borderRadius: "50%", width: "40px", height: "40px",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", cursor: "pointer",
          }}
        >
          <X size={20} />
        </button>
      </div>

      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", maxWidth: "1000px", padding: "0 70px", flex: 1, minHeight: 0 }}>
        {images.length > 1 && (
          <button
            onClick={goPrev}
            aria-label="Previous image"
            style={{
              position: "absolute", left: "10px", background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.16)", borderRadius: "50%",
              width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", cursor: "pointer",
            }}
          >
            <ChevronLeft size={22} />
          </button>
        )}

        <img
          src={current.url}
          alt={current.caption ?? ""}
          style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: "var(--radius-lg)" }}
        />

        {images.length > 1 && (
          <button
            onClick={goNext}
            aria-label="Next image"
            style={{
              position: "absolute", right: "10px", background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.16)", borderRadius: "50%",
              width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", cursor: "pointer",
            }}
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {current.caption && (
        <p style={{ margin: "12px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>{current.caption}</p>
      )}

      {images.length > 1 && (
        <div style={{ display: "flex", gap: "8px", padding: "18px 20px 0", maxWidth: "90vw", overflowX: "auto" }}>
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => onIndexChange(i)}
              style={{
                width: "56px", height: "56px", flexShrink: 0, padding: 0, cursor: "pointer",
                borderRadius: "var(--radius-md)",
                background: `url(${img.url}) center/cover`,
                border: i === index ? "2px solid var(--color-accent)" : "1px solid rgba(255,255,255,0.2)",
                opacity: i === index ? 1 : 0.55,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
