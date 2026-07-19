import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";

export type EventCategory = "GENERAL" | "HARINAM";

export interface EventItem {
  id: string;
  title: string;
  description: string | null;
  venue: string;
  city: string | null;
  date: string;
  ticketUrl: string | null;
  imageUrl: string | null;
  category: EventCategory;
  createdAt: string;
  updatedAt: string;
}

export interface EventInput {
  title: string;
  description?: string;
  venue: string;
  city?: string;
  date: string;
  ticketUrl?: string;
  imageUrl?: string;
  category?: EventCategory;
}

export const eventsService = {
  async getEvents(): Promise<{ data: { events: EventItem[] } }> {
    const { data } = await apiClient.get(endpoints.adminEvents.list);
    return data;
  },
  async createEvent(input: EventInput) {
    const { data } = await apiClient.post(endpoints.adminEvents.list, input);
    return data;
  },
  async updateEvent(id: string, input: Partial<EventInput>) {
    const { data } = await apiClient.patch(endpoints.adminEvents.byId(id), input);
    return data;
  },
  async deleteEvent(id: string) {
    const { data } = await apiClient.delete(endpoints.adminEvents.byId(id));
    return data;
  },
};
