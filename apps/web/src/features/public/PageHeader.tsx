"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import SacredRule from "./SacredRule";
import AccountHeaderWidget from "./AccountHeaderWidget";

interface PageHeaderProps {
  title: string;
  action?: React.ReactNode;
  tabs?: React.ReactNode;
}

export default function PageHeader({ title, action, tabs }: PageHeaderProps) {
  const [slot, setSlot] = useState<Element | null>(null);

  useEffect(() => {
    setSlot(document.getElementById("pk-header-slot"));
  }, []);

  const content = (
    <div style={{ padding: "24px 32px 20px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <h1 style={{
            fontFamily: "var(--font-cormorant), serif",
            fontSize:   "36px",
            fontWeight: 600,
            color:      "var(--color-text-primary)",
            margin:     0,
          }}>
            {title}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "4px" }}>
            {action}
            <AccountHeaderWidget />
          </div>
        </div>
        <SacredRule />
        {tabs}
      </div>
    </div>
  );

  if (!slot) return null;
  return createPortal(content, slot);
}
