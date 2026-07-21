"use client";
import { Suspense } from "react";
import { TeamPage } from "@/features/admin/pages/TeamPage";

export default function AdminTeamPage() {
  return (
    <Suspense>
      <TeamPage />
    </Suspense>
  );
}
