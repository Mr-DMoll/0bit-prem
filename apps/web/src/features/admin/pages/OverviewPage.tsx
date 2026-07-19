"use client";

export function AdminOverviewPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 600, color: "var(--color-text-primary)" }}>Overview</h1>
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "4px" }}>
          Premvkay at a glance
        </p>
      </div>

      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        minHeight: "40vh", gap: "12px",
      }}>
        <div style={{
          width: "48px", height: "48px", borderRadius: "12px",
          background: "var(--color-bg-secondary)", border: "2px dashed var(--color-border)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px",
        }}>
          🚧
        </div>
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
          Catalog, merch, and booking stats will appear here.
        </p>
      </div>
    </div>
  );
}
