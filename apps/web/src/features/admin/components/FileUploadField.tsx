"use client";

import { useRef, useState } from "react";
import { Upload, Music as MusicIcon } from "lucide-react";
import { uploadsService } from "../services/uploads.service";

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)",
  marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em",
};

interface FileUploadFieldProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  accept: "image/*" | "audio/*";
  folder: "albums" | "tracks" | "events" | "gallery";
}

export function FileUploadField({ label, value, onChange, accept, folder }: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const isImage = accept === "image/*";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true); setError(null);
    try {
      const url = await uploadsService.upload(file, folder);
      onChange(url);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      {label && <label style={labelStyle}>{label}</label>}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {isImage ? (
          <div style={{
            width: "48px", height: "48px", borderRadius: "var(--radius-md)", flexShrink: 0,
            background: value ? `url(${value}) center/cover` : "var(--color-bg-subtle)",
            border: "1px solid var(--color-border)",
          }} />
        ) : (
          <div style={{
            width: "48px", height: "48px", borderRadius: "var(--radius-md)", flexShrink: 0,
            background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: value ? "var(--color-accent)" : "var(--color-text-muted)",
          }}>
            <MusicIcon size={18} />
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "8px 14px", fontSize: "12.5px", fontWeight: 600,
              background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)", color: "var(--color-text-secondary)",
              cursor: isUploading ? "not-allowed" : "pointer",
            }}
          >
            <Upload size={13} />
            {isUploading ? "Uploading…" : value ? "Replace file" : "Choose file"}
          </button>
          {value && !isUploading && (
            <p style={{ margin: "6px 0 0", fontSize: "11px", color: "var(--color-text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {value.split("/").pop()}
            </p>
          )}
          {error && <p style={{ margin: "6px 0 0", fontSize: "11px", color: "var(--color-danger)" }}>{error}</p>}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}
