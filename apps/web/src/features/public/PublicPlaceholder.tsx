import PageHeader from "./PageHeader";

interface PublicPlaceholderProps {
  title: string;
  description?: string;
  hero?: boolean;
}

export default function PublicPlaceholder({ title, description, hero }: PublicPlaceholderProps) {
  return (
    <div style={{ position: "relative" }}>
      {hero && (
        <div
          style={{
            position:      "absolute",
            top:           "50%",
            left:          "50%",
            transform:     "translate(-50%, -50%)",
            width:         "480px",
            height:        "480px",
            borderRadius:  "50%",
            pointerEvents: "none",
            background:    "radial-gradient(circle, hsl(38,92%,50%,0.14) 0%, hsl(38,92%,40%,0.06) 45%, transparent 70%)",
            animation:     "pk-glow-pulse 3s ease-in-out infinite",
          }}
        />
      )}
      <div style={{ position: "relative" }}>
        <PageHeader title={title} />
        <p style={{
          fontSize: "14px",
          color:    "var(--color-text-muted)",
          margin:   "8px 0 0",
        }}>
          {description ?? "Coming soon."}
        </p>
      </div>
    </div>
  );
}
