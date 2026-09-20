import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";
import { cachedGet } from "@/api/cache";

export interface PublicEvent {
  id: string;
  title: string;
  description: string | null;
  venue: string;
  city: string | null;
  date: string;
  ticketUrl: string | null;
  imageUrl: string | null;
  category: "GENERAL" | "HARINAM";
}

export const publicEventsService = {
  async getEvents(category?: "GENERAL" | "HARINAM"): Promise<{ data: { events: PublicEvent[] } }> {
    return cachedGet(`events:${category ?? "all"}`, async () =>
      (await apiClient.get(endpoints.events.list, { params: category ? { category } : undefined })).data);
  },
  async getEvent(id: string): Promise<{ data: { event: PublicEvent } }> {
    const { data } = await apiClient.get(endpoints.events.byId(id));
    return data;
  },
};
