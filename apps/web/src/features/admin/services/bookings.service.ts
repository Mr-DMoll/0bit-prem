import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";

export interface BookingInquiryItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  eventDetails: string;
  message: string | null;
  status: "NEW" | "CONTACTED" | "CONFIRMED" | "DECLINED" | "ARCHIVED";
  createdAt: string;
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
};
