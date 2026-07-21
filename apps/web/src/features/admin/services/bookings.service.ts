import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";

export interface BookingReplyItem {
  id: string;
  message: string;
  sentByEmail: string;
  createdAt: string;
}

export interface BookingInquiryItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  eventType: string | null;
  eventDate: string | null;
  venue: string | null;
  eventDetails: string | null;
  message: string | null;
  internalNotes: string | null;
  status: "NEW" | "CONTACTED" | "CONFIRMED" | "DECLINED" | "ARCHIVED";
  replies: BookingReplyItem[];
  createdAt: string;
}

export interface BookingEventTypeOption {
  id: string;
  label: string;
  isEnabled: boolean;
  order: number;
}

export const bookingsService = {
  async getInquiries(status?: string): Promise<{ data: { inquiries: BookingInquiryItem[] } }> {
    const { data } = await apiClient.get(endpoints.adminBookings.list, { params: status ? { status } : undefined });
    return data;
  },
  async updateStatus(id: string, status: string) {
    const { data } = await apiClient.patch(endpoints.adminBookings.updateStatus(id), { status });
    return data;
  },
  async updateNotes(id: string, internalNotes: string) {
    const { data } = await apiClient.patch(endpoints.adminBookings.updateNotes(id), { internalNotes });
    return data;
  },
  async reply(id: string, message: string): Promise<{ data: { reply: BookingReplyItem } }> {
    const { data } = await apiClient.post(endpoints.adminBookings.reply(id), { message });
    return data;
  },
  async listEventTypes(): Promise<{ data: { eventTypes: BookingEventTypeOption[] } }> {
    const { data } = await apiClient.get(endpoints.adminBookings.eventTypes);
    return data;
  },
  async createEventType(label: string): Promise<{ data: { eventType: BookingEventTypeOption } }> {
    const { data } = await apiClient.post(endpoints.adminBookings.eventTypes, { label });
    return data;
  },
  async updateEventType(id: string, patch: { label?: string; isEnabled?: boolean }): Promise<{ data: { eventType: BookingEventTypeOption } }> {
    const { data } = await apiClient.patch(endpoints.adminBookings.eventTypeById(id), patch);
    return data;
  },
  async deleteEventType(id: string): Promise<void> {
    await apiClient.delete(endpoints.adminBookings.eventTypeById(id));
  },
};
