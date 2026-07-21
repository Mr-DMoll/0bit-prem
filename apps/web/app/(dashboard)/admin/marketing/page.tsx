"use client";
import { Suspense } from "react";
import { MarketingPage } from "@/features/admin/pages/MarketingPage";

export default function AdminMarketingPage() {
  return (
    <Suspense>
      <MarketingPage />
    </Suspense>
  );
}
