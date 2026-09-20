"use client";

import { useEffect } from "react";
import PublicSidebar from "./PublicSidebar";
import { publicContentService } from "./services/content.service";
import { publicMusicService } from "./services/music.service";
import { publicGalleryService } from "./services/gallery.service";
import { publicEventsService } from "./services/events.service";
import { publicMerchService } from "./services/merch.service";
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

// Once the page the visitor asked for has painted, quietly fetch the public data the
// other tabs need, so tapping the sidebar shows content instantly instead of a spinner.
function usePrefetchPublicData() {
  useEffect(() => {
    const run = () => {
      const swallow = () => {};
      publicContentService.getContent().catch(swallow);
      publicMusicService.getAlbums().catch(swallow);
      publicGalleryService.getImages().catch(swallow);
      publicEventsService.getEvents("GENERAL").catch(swallow);
      publicEventsService.getEvents("HARINAM").catch(swallow);
      publicMerchService.getProducts().catch(swallow);
    };
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(run, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(run, 1500);
    return () => clearTimeout(id);
  }, []);
}

export default function PublicShell({ children }: { children: React.ReactNode }) {
  usePrefetchPublicData();
  return (
    <MusicPlayerProvider>
      <CartProvider>
        <AppFrame>{children}</AppFrame>
      </CartProvider>
    </MusicPlayerProvider>
  );
}
