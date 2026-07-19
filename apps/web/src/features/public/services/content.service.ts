import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";

export interface PublicContent {
  about_bio: string;
  contact_email: string;
  contact_phone: string;
  contact_socials: string;
  harinam_intro: string;
  sanctum_quote: string;
}

export const publicContentService = {
  async getContent(): Promise<{ data: { content: PublicContent } }> {
    const { data } = await apiClient.get(endpoints.content.get);
    return data;
  },
};
