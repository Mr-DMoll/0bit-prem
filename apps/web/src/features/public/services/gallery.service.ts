import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";

export interface PublicGalleryAlbum {
  id: string;
  name: string;
  order: number;
  _count: { images: number };
}

export interface PublicGalleryImage {
  id: string;
  url: string;
  caption: string | null;
  order: number;
  albumId: string | null;
  album: { id: string; name: string } | null;
}

export const publicGalleryService = {
  async getImages(): Promise<{ data: { images: PublicGalleryImage[]; albums: PublicGalleryAlbum[] } }> {
    const { data } = await apiClient.get(endpoints.gallery.list);
    return data;
  },
};
