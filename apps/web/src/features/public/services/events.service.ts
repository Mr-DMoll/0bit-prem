import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";

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
    const { data } = await apiClient.get(endpoints.events.list, { params: category ? { category } : undefined });
    return data;
  },
  async getEvent(id: string): Promise<{ data: { event: PublicEvent } }> {
    const { data } = await apiClient.get(endpoints.events.byId(id));
    return data;
  },
};
