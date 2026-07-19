import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";

export interface GalleryImageItem {
  id: string;
  url: string;
  caption: string | null;
  order: number;
  createdAt: string;
}

export const galleryService = {
  async getImages(): Promise<{ data: { images: GalleryImageItem[] } }> {
    const { data } = await apiClient.get(endpoints.adminGallery.list);
    return data;
  },
  async createImage(input: { url: string; caption?: string }) {
    const { data } = await apiClient.post(endpoints.adminGallery.list, input);
    return data;
  },
  async updateImage(id: string, input: { caption?: string; swapWithOrder?: number }) {
    const { data } = await apiClient.patch(endpoints.adminGallery.byId(id), input);
    return data;
  },
  async deleteImage(id: string) {
    const { data } = await apiClient.delete(endpoints.adminGallery.byId(id));
    return data;
  },
};
