"use client";
import { use } from "react";
import { AlbumTracksPage } from "@/features/admin/pages/AlbumTracksPage";

export default function AdminAlbumTracksRoute({ params }: { params: Promise<{ albumId: string }> }) {
  const { albumId } = use(params);
  return <AlbumTracksPage albumId={albumId} />;
}
