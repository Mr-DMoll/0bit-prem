import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";

export interface Track {
  id: string;
  title: string;
  order: number;
  duration: number;
  audioUrl: string;
  isFree: boolean;
}

export interface Album {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  status: "DRAFT" | "LIVE" | "ARCHIVED";
  priceCents: number;
  currency: string;
  releaseDate: string | null;
  tracks?: Track[];
  createdAt: string;
  updatedAt: string;
}

export interface AlbumInput {
  title: string;
  description?: string;
  coverImageUrl?: string;
  priceCents: number;
  currency?: string;
  releaseDate?: string;
  status?: "DRAFT" | "LIVE" | "ARCHIVED";
}

export interface TrackInput {
  title: string;
  audioUrl: string;
  isFree?: boolean;
  duration?: number;
}

export const musicService = {
  async getAlbums(): Promise<{ data: { albums: Album[] } }> {
    const { data } = await apiClient.get(endpoints.adminMusic.albums);
    return data;
  },

  async getAlbum(id: string): Promise<{ data: { album: Album } }> {
    const { data } = await apiClient.get(endpoints.adminMusic.albumById(id));
    return data;
  },

  async createAlbum(input: AlbumInput) {
    const { data } = await apiClient.post(endpoints.adminMusic.albums, input);
    return data;
  },

  async updateAlbum(id: string, input: Partial<AlbumInput>) {
    const { data } = await apiClient.patch(endpoints.adminMusic.albumById(id), input);
    return data;
  },

  async deleteAlbum(id: string) {
    const { data } = await apiClient.delete(endpoints.adminMusic.albumById(id));
    return data;
  },

  async createTrack(albumId: string, input: TrackInput) {
    const { data } = await apiClient.post(endpoints.adminMusic.tracks(albumId), input);
    return data;
  },

  async createTracksBatch(albumId: string, tracks: TrackInput[]): Promise<{ data: { tracks: Track[] } }> {
    const { data } = await apiClient.post(endpoints.adminMusic.tracksBatch(albumId), { tracks });
    return data;
  },

  async bulkUpdateTracks(
    albumId: string,
    updates: { id: string; title?: string; isFree?: boolean; order?: number }[],
    deletes: string[]
  ): Promise<{ data: { tracks: Track[] } }> {
    const { data } = await apiClient.patch(endpoints.adminMusic.tracksBulk(albumId), { updates, deletes });
    return data;
  },

  async updateTrack(id: string, input: Partial<TrackInput> & { swapWithOrder?: number }) {
    const { data } = await apiClient.patch(endpoints.adminMusic.trackById(id), input);
    return data;
  },

  async deleteTrack(id: string) {
    const { data } = await apiClient.delete(endpoints.adminMusic.trackById(id));
    return data;
  },
};
