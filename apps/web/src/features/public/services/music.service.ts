import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";

export interface PublicAlbum {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  priceCents: number;
  currency: string;
  releaseDate: string | null;
}

export interface PublicTrack {
  id: string;
  title: string;
  order: number;
  duration: number;
  isFree: boolean;
  isLocked: boolean;
  audioUrl: string | null;
  // Only present on cross-album queues (the Sanctum mix) — a single-album
  // queue (from getAlbum) relies on the shared album context instead.
  albumId?: string;
  albumTitle?: string;
  albumCoverUrl?: string | null;
}

export interface SanctumMix {
  mode: "owned" | "sampler";
  tracks: PublicTrack[];
}

export interface MyAlbumPurchase {
  id: string;
  purchasedAt: string;
  album: PublicAlbum;
}

export const publicMusicService = {
  async getAlbums(): Promise<{ data: { albums: PublicAlbum[] } }> {
    const { data } = await apiClient.get(endpoints.music.albums);
    return data;
  },

  async getMyAlbums(): Promise<{ data: { purchases: MyAlbumPurchase[] } }> {
    const { data } = await apiClient.get(endpoints.music.myAlbums);
    return data;
  },

  async getAlbum(id: string): Promise<{ data: { album: PublicAlbum; tracks: PublicTrack[]; isOwned: boolean } }> {
    const { data } = await apiClient.get(endpoints.music.albumById(id));
    return data;
  },

  async purchase(id: string) {
    const { data } = await apiClient.post(endpoints.music.purchase(id));
    return data;
  },

  async getSanctumMix(): Promise<{ data: SanctumMix }> {
    const { data } = await apiClient.get(endpoints.music.sanctumMix);
    return data;
  },
};
