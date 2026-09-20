import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";
import { cachedGet } from "@/api/cache";

export interface PublicContent {
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

export const publicContentService = {
  async getContent(): Promise<{ data: { content: PublicContent } }> {
    return cachedGet("content", async () => (await apiClient.get(endpoints.content.get)).data);
  },
};
