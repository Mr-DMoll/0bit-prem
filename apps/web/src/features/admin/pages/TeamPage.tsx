"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CustomersPage } from "./CustomersPage";
import { ManagersPage } from "./ManagersPage";
import { AdminActivityPage } from "./ActivityPage";

const TABS = ["customers", "managers", "activity"] as const;
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

export function TeamPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState<Tab>(
    tabParam === "managers" ? "managers" : tabParam === "activity" ? "activity" : "customers"
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

      {tab === "customers" ? <CustomersPage /> : tab === "managers" ? <ManagersPage /> : <AdminActivityPage />}
    </div>
  );
}
