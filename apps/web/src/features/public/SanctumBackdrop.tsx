// Placeholder atmosphere shot until real Premvkay photography replaces it.
export const SANCTUM_BACKDROP_URL = "https://images.unsplash.com/photo-1750759213152-cc80468c21a6?w=1600&h=1000&fit=crop&auto=format&q=85";

// Full-bleed backdrop for the Sanctum home screen. Fixed so it reaches the
// viewport edges (behind the floating sidebar) regardless of the content column.
export function SanctumBackdrop({ playing }: { playing: boolean }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
      <img
        src={SANCTUM_BACKDROP_URL}
        alt=""
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center 35%",
          opacity: playing ? 0.62 : 0.48,
          transition: "opacity 1.4s ease",
        }}
      />
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 80% 75% at 50% 45%, transparent 20%, hsl(12,85%,3%,0.73) 65%, hsl(12,85%,3%,0.96) 100%)",
      }} />
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -55%)",
        width: "600px", height: "600px", borderRadius: "50%",
        background: `radial-gradient(circle, hsl(38,92%,50%,${playing ? 0.12 : 0.055}) 0%, transparent 65%)`,
        pointerEvents: "none", transition: "opacity 1.4s ease",
      }} />
    </div>
  );
}
