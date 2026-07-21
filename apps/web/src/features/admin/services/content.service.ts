import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";

export interface ContentMap {
  about_bio: string;
  harinam_intro: string;
  sanctum_quote: string;
  contact_email: string;
  contact_phone: string;
  contact_social_instagram: string;
  contact_social_youtube: string;
  contact_social_facebook: string;
  contact_social_x: string;
  contact_social_website: string;
}

export interface ContentMetaEntry {
  updatedAt: string;
  hasPrevious: boolean;
}

export type ContentMeta = Record<keyof ContentMap, ContentMetaEntry>;

export const contentService = {
  async getContent(): Promise<{ data: { content: ContentMap; meta: ContentMeta } }> {
    const { data } = await apiClient.get(endpoints.adminContent.get);
    return data;
  },
  async updateContent(key: keyof ContentMap, value: string): Promise<{ data: { meta: ContentMetaEntry } }> {
    const { data } = await apiClient.put(endpoints.adminContent.get, { key, value });
    return data;
  },
  async revertContent(key: keyof ContentMap): Promise<{ data: { setting: { value: string }; meta: ContentMetaEntry } }> {
    const { data } = await apiClient.post(endpoints.adminContent.revert(key));
    return data;
  },
};
