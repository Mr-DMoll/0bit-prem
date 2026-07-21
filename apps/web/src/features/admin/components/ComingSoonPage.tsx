interface ComingSoonPageProps {
  title: string;
  description: string;
  items: string[];
}

export function ComingSoonPage({ title, description, items }: ComingSoonPageProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>{title}</h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>{description}</p>
      </div>

      <div style={{
        background: "var(--color-card-bg)", border: "1px solid var(--color-card-border)",
        borderRadius: "var(--radius-xl)", boxShadow: "var(--color-card-shadow)", padding: "40px",
      }}>
        <p style={{ margin: "0 0 16px", fontSize: "13px", fontWeight: 700, color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Coming soon
        </p>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
          {items.map((item) => (
            <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
              <span style={{ color: "var(--color-text-muted)", flexShrink: 0 }}>—</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
