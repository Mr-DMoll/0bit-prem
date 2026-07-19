"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { uploadsService } from "../services/uploads.service";

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)",
  marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em",
};

interface ProductImagesFieldProps {
  label?: string;
  images: string[];
  onChange: (images: string[]) => void;
}

export function ProductImagesField({ label, images, onChange }: ProductImagesFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true); setError(null);
    try {
      const url = await uploadsService.upload(file, "products");
      onChange([...images, url]);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = (url: string) => onChange(images.filter((i) => i !== url));

  return (
    <div>
      {label && <label style={labelStyle}>{label}</label>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {images.map((url) => (
          <div key={url} style={{ position: "relative", width: "64px", height: "64px" }}>
            <div style={{
              width: "100%", height: "100%", borderRadius: "var(--radius-md)",
              background: `url(${url}) center/cover`, border: "1px solid var(--color-border)",
            }} />
            <button
              type="button"
              onClick={() => handleRemove(url)}
              style={{
                position: "absolute", top: "-6px", right: "-6px", width: "20px", height: "20px",
                borderRadius: "50%", background: "var(--color-danger)", border: "none", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              }}
            >
              <X size={11} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          style={{
            width: "64px", height: "64px", borderRadius: "var(--radius-md)",
            background: "var(--color-bg-subtle)", border: "1px dashed var(--color-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--color-text-muted)", cursor: isUploading ? "not-allowed" : "pointer",
          }}
        >
          <Upload size={16} />
        </button>
      </div>
      {isUploading && <p style={{ margin: "8px 0 0", fontSize: "11px", color: "var(--color-text-muted)" }}>Uploading…</p>}
      {error && <p style={{ margin: "8px 0 0", fontSize: "11px", color: "var(--color-danger)" }}>{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
    </div>
  );
}
