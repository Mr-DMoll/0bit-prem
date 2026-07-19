"use client";
import { Suspense } from "react";
import { MerchPage } from "@/features/admin/pages/MerchPage";

export default function AdminMerchPage() {
  return (
    <Suspense>
      <MerchPage />
    </Suspense>
  );
}
