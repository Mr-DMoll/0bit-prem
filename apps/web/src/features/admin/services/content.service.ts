import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";

export interface ContentMap {
  about_bio: string;
  contact_email: string;
  contact_phone: string;
  contact_socials: string;
  harinam_intro: string;
  sanctum_quote: string;
}

export const contentService = {
  async getContent(): Promise<{ data: { content: ContentMap } }> {
    const { data } = await apiClient.get(endpoints.adminContent.get);
    return data;
  },
  async updateContent(key: string, value: string) {
    const { data } = await apiClient.put(endpoints.adminContent.get, { key, value });
    return data;
  },
};
