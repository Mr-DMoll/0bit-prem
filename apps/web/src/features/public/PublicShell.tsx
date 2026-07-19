"use client";

import PublicSidebar from "./PublicSidebar";
import MiniPlayer from "./MiniPlayer";
import { MusicPlayerProvider, useMusicPlayer } from "./MusicPlayerContext";
import { CartProvider } from "./CartContext";

function AppFrame({ children }: { children: React.ReactNode }) {
  const { nowPlaying } = useMusicPlayer();

  return (
    <div className="pk-app" style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--color-bg)" }}>
      <PublicSidebar />
      <div id="pk-header-slot" style={{ marginLeft: "var(--pk-content-margin-left)", background: "var(--color-bg)", position: "relative", zIndex: 20, flexShrink: 0 }} />
      <main className="pk-main-scroll" style={{
        marginLeft:  "var(--pk-content-margin-left)",
        flex:        1,
        minHeight:   0,
        overflowY:     "auto",
        paddingTop:    "28px",
        paddingLeft:   "32px",
        paddingRight:  "32px",
        paddingBottom: nowPlaying ? "var(--pk-content-bottom-playing)" : "var(--pk-content-bottom-idle)",
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {children}
        </div>
      </main>
      {nowPlaying && <MiniPlayer />}
    </div>
  );
}

export default function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <MusicPlayerProvider>
      <CartProvider>
        <AppFrame>{children}</AppFrame>
      </CartProvider>
    </MusicPlayerProvider>
  );
}
