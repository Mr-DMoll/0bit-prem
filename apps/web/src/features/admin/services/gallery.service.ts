import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";

export interface GalleryAlbumItem {
  id: string;
  name: string;
  order: number;
  _count: { images: number };
}

export interface GalleryImageItem {
  id: string;
  url: string;
  caption: string | null;
  order: number;
  albumId: string | null;
  album: { id: string; name: string } | null;
  createdAt: string;
}

export const galleryService = {
  async getImages(albumId?: string): Promise<{ data: { images: GalleryImageItem[] } }> {
    const { data } = await apiClient.get(endpoints.adminGallery.list, {
      params: albumId ? { albumId } : undefined,
    });
    return data;
  },
  async createImage(input: { url: string; caption?: string; albumId?: string | null }) {
    const { data } = await apiClient.post(endpoints.adminGallery.list, input);
    return data;
  },
  async bulkCreateImages(images: { url: string; caption?: string; albumId?: string | null }[]) {
    const { data } = await apiClient.post(endpoints.adminGallery.bulk, { images });
    return data;
  },
  async updateImage(id: string, input: { caption?: string; albumId?: string | null }) {
    const { data } = await apiClient.patch(endpoints.adminGallery.byId(id), input);
    return data;
  },
  async reorderImages(order: string[]) {
    const { data } = await apiClient.patch(endpoints.adminGallery.reorder, { order });
    return data;
  },
  async bulkMoveImages(ids: string[], albumId: string | null) {
    const { data } = await apiClient.patch(endpoints.adminGallery.bulkMove, { ids, albumId });
    return data;
  },
  async bulkDeleteImages(ids: string[]) {
    const { data } = await apiClient.delete(endpoints.adminGallery.bulk, { data: { ids } });
    return data;
  },
  async deleteImage(id: string) {
    const { data } = await apiClient.delete(endpoints.adminGallery.byId(id));
    return data;
  },

  async getAlbums(): Promise<{ data: { albums: GalleryAlbumItem[] } }> {
    const { data } = await apiClient.get(endpoints.adminGallery.albums);
    return data;
  },
  async createAlbum(name: string) {
    const { data } = await apiClient.post(endpoints.adminGallery.albums, { name });
    return data;
  },
  async updateAlbum(id: string, input: { name?: string; order?: number }) {
    const { data } = await apiClient.patch(endpoints.adminGallery.albumById(id), input);
    return data;
  },
  async deleteAlbum(id: string) {
    const { data } = await apiClient.delete(endpoints.adminGallery.albumById(id));
    return data;
  },
};
