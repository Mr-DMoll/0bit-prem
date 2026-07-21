"use client";
import { Suspense } from "react";
import { DashboardPage } from "@/features/admin/pages/DashboardPage";

export default function Page() {
  return (
    <Suspense>
      <DashboardPage />
    </Suspense>
  );
}
