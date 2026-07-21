"use client";
import { Suspense } from "react";
import { MediaPage } from "@/features/admin/pages/MediaPage";

export default function AdminMediaPage() {
  return (
    <Suspense>
      <MediaPage />
    </Suspense>
  );
}
