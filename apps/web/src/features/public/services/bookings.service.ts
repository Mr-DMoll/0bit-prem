import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";

export interface BookingInquiryInput {
  name: string;
  email: string;
  phone?: string;
  eventDetails: string;
  message?: string;
}

export const publicBookingsService = {
  async submit(input: BookingInquiryInput) {
    const { data } = await apiClient.post(endpoints.bookings.submit, input);
    return data;
  },
};
