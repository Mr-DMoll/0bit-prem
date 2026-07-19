"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { PUBLIC_NAV } from "./publicNav.config";
import {
  Sparkles, Music, Flame, ShoppingBag, Images, CalendarDays, Info, Mail, UserCircle, MoreHorizontal, X,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  Sparkles, Music, Flame, ShoppingBag, Images, CalendarDays, Info, Mail, UserCircle,
};

// Bottom tab bar (<=1023px) only has room for a few tabs — these four cover
// the primary jobs (home/player, browse, buy); everything else lives in "More".
const TAB_BAR_HREFS = ["/", "/music", "/merch"];

export default function PublicSidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;
  const [showMore, setShowMore] = useState(false);

  const renderItem = (href: string, label: string, icon: string, vertical = true) => {
    const Icon = ICON_MAP[icon];
    const active = isActive(href);
    return (
      <Link
        key={href}
        href={href}
        onClick={() => setShowMore(false)}
        style={{
          position:       "relative",
          display:        "flex",
          flexDirection:  vertical ? "column" : "row",
          alignItems:     "center",
          justifyContent: vertical ? "center" : "flex-start",
          gap:            vertical ? "4px" : "12px",
          width:          "100%",
          padding:        vertical ? "14px 0" : "13px 16px",
          color:          active ? "var(--color-sidebar-text-active)" : "var(--color-sidebar-text)",
          textDecoration: "none",
          transition:     "color 0.2s",
        }}
      >
        {active && vertical && (
          <span style={{
            position:     "absolute",
            left:         0,
            top:          "10px",
            bottom:       "10px",
            width:        "3px",
            borderRadius: "0 3px 3px 0",
            background:   "var(--color-sidebar-indicator)",
          }} />
        )}
        {active && vertical && (
          <span style={{
            position:     "absolute",
            top:          "4px",
            bottom:       "4px",
            left:         "8px",
            right:        "8px",
            borderRadius: "var(--radius-xl)",
            background:   "var(--color-sidebar-item-active-bg)",
            zIndex:       -1,
          }} />
        )}
        {Icon && <Icon size={vertical ? 17 : 19} strokeWidth={active ? 2.2 : 1.8} />}
        <span style={{
          fontFamily:    "var(--font-inter), sans-serif",
          fontSize:      vertical ? "10px" : "14px",
          fontWeight:    vertical ? 500 : 600,
          letterSpacing: "0.02em",
        }}>
          {label}
        </span>
      </Link>
    );
  };

  const tabBarItems = PUBLIC_NAV.filter((item) => TAB_BAR_HREFS.includes(item.href));
  const moreItems = PUBLIC_NAV.filter((item) => !TAB_BAR_HREFS.includes(item.href));
  const moreActive = moreItems.some((item) => isActive(item.href));

  return (
    <>
      {/* Desktop: floating vertical icon rail */}
      <aside className="pk-sidebar-desktop" style={{
        position:        "fixed",
        top:             "50%",
        left:            "20px",
        transform:       "translateY(-50%)",
        width:           "80px",
        flexDirection:   "column",
        alignItems:      "center",
        padding:         "12px 0",
        border:          "1px solid var(--color-sidebar-border)",
        borderRadius:    "20px",
        backgroundColor: "var(--color-sidebar-bg)",
        boxShadow:       "var(--color-card-shadow)",
        overflow:        "hidden",
        zIndex:          10,
      }}>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          {PUBLIC_NAV.map((item) => renderItem(item.href, item.label, item.icon))}
        </div>
      </aside>

      {/* Mobile/tablet: bottom tab bar + "More" sheet for the rest */}
      <nav className="pk-tabbar-mobile" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30,
        alignItems: "stretch",
        background: "var(--color-sidebar-bg)",
        borderTop: "1px solid var(--color-sidebar-border)",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.25)",
      }}>
        {tabBarItems.map((item) => renderItem(item.href, item.label, item.icon))}
        <button
          onClick={() => setShowMore((v) => !v)}
          style={{
            position: "relative", display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: "4px", width: "100%", padding: "14px 0",
            background: "none", border: "none", cursor: "pointer",
            color: moreActive || showMore ? "var(--color-sidebar-text-active)" : "var(--color-sidebar-text)",
          }}
        >
          <MoreHorizontal size={17} strokeWidth={moreActive || showMore ? 2.2 : 1.8} />
          <span style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "10px", fontWeight: 500, letterSpacing: "0.02em" }}>
            More
          </span>
        </button>
      </nav>

      {showMore && (
        <div
          className="pk-tabbar-mobile"
          onClick={() => setShowMore(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 29,
            background: "rgba(0,0,0,0.5)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute", bottom: "64px", left: 0, right: 0,
              background: "var(--color-sidebar-bg)", borderTop: "1px solid var(--color-sidebar-border)",
              borderRadius: "16px 16px 0 0", padding: "8px 0 max(8px, env(safe-area-inset-bottom))",
              maxHeight: "60vh", overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                More
              </span>
              <button
                onClick={() => setShowMore(false)}
                aria-label="Close"
                style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>
            {moreItems.map((item) => renderItem(item.href, item.label, item.icon, false))}
          </div>
        </div>
      )}
    </>
  );
}
