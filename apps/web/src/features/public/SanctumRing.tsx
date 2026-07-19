export function EqBars() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 18 }}>
      {[
        { h: 14, dur: "0.7s", delay: "0s" },
        { h: 9, dur: "0.9s", delay: "0.15s" },
        { h: 17, dur: "0.6s", delay: "0.05s" },
        { h: 11, dur: "0.8s", delay: "0.2s" },
      ].map((b, i) => (
        <div
          key={i}
          style={{
            width: 3, height: b.h, borderRadius: 2, background: "var(--color-accent)",
            animation: `pk-eq ${b.dur} ease-in-out ${b.delay} infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

// Rounding sidesteps a hydration mismatch: Math.cos/sin can differ in their
// last bit between the server's and browser's JS engine at full precision.
function round(n: number) {
  return Math.round(n * 1000) / 1000;
}

// Minimal yantra/mandala ring — a still frame drawn around the play orb.
export function YantraRing({ size = 360 }: { size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r1 = size / 2 - 3;
  const r2 = size / 2 - 18;

  const ticks = Array.from({ length: 24 }, (_, i) => {
    const a = (i * 15 * Math.PI) / 180;
    const isCardinal = i % 6 === 0;
    const len = isCardinal ? 11 : 6;
    return {
      x1: round(cx + Math.cos(a) * r1),
      y1: round(cy + Math.sin(a) * r1),
      x2: round(cx + Math.cos(a) * (r1 - len)),
      y2: round(cy + Math.sin(a) * (r1 - len)),
      isCardinal,
    };
  });

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    >
      <circle cx={cx} cy={cy} r={r1} fill="none" stroke="var(--color-accent)" strokeWidth="0.9" opacity="0.55" />
      <circle cx={cx} cy={cy} r={r2} fill="none" stroke="var(--color-accent)" strokeWidth="0.5" opacity="0.3" />
      {ticks.map((t, i) => (
        <line
          key={i}
          x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke="var(--color-accent)"
          strokeWidth={t.isCardinal ? 1.2 : 0.7}
          opacity={t.isCardinal ? 0.65 : 0.3}
        />
      ))}
      {[0, 90, 180, 270].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x = round(cx + Math.cos(rad) * (r1 + 9));
        const y = round(cy + Math.sin(rad) * (r1 + 9));
        return (
          <polygon
            key={deg}
            points={`${x},${y - 4.5} ${x + 3},${y} ${x},${y + 4.5} ${x - 3},${y}`}
            fill="var(--color-accent)" opacity="0.45"
          />
        );
      })}
    </svg>
  );
}
