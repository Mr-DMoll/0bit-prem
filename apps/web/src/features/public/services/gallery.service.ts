import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";

export interface PublicGalleryImage {
  id: string;
  url: string;
  caption: string | null;
  order: number;
}

export const publicGalleryService = {
  async getImages(): Promise<{ data: { images: PublicGalleryImage[] } }> {
    const { data } = await apiClient.get(endpoints.gallery.list);
    return data;
  },
};
