import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";

export interface BookingInquiryInput {
  name: string;
  phone?: string;
  eventType?: string;
  eventDate?: string;
  venue?: string;
  eventDetails?: string;
  message?: string;
}

export const publicBookingsService = {
  async submit(input: BookingInquiryInput) {
    const { data } = await apiClient.post(endpoints.bookings.submit, input);
    return data;
  },
  async getEventTypes(): Promise<{ data: { enabledEventTypes: string[] } }> {
    const { data } = await apiClient.get(endpoints.bookings.eventTypes);
    return data;
  },
};
