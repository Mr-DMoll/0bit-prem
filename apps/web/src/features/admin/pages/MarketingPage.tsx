"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { DiscountsPage } from "./DiscountsPage";
import { BroadcastsPage } from "./BroadcastsPage";

const TABS = ["discounts", "broadcasts"] as const;
type Tab = typeof TABS[number];

function tabBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: "10px 16px", background: "none", border: "none",
    borderBottom: active ? "2px solid var(--color-accent)" : "2px solid transparent",
    fontSize: "13.5px", fontWeight: 600,
    color: active ? "var(--color-accent)" : "var(--color-text-muted)",
    cursor: "pointer", textTransform: "capitalize",
  };
}

export function MarketingPage() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(
    searchParams.get("tab") === "broadcasts" ? "broadcasts" : "discounts"
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid var(--color-border)" }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={tabBtnStyle(tab === t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "discounts" ? <DiscountsPage /> : <BroadcastsPage />}
    </div>
  );
}
