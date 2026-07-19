import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";

export interface OrderItemView {
  id: string;
  quantity: number;
  unitPriceCents: number;
  productVariant: {
    label: string;
    product: { name: string };
  };
}

export interface OrderView {
  id: string;
  status: "PENDING" | "PAID" | "FULFILLED" | "CANCELLED";
  totalCents: number;
  currency: string;
  shippingName: string;
  shippingPhone: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  createdAt: string;
  items: OrderItemView[];
  user: { email: string; displayName: string | null; firstName: string | null; lastName: string | null };
}

export const merchOrdersService = {
  async getOrders(status?: string): Promise<{ data: { orders: OrderView[] } }> {
    const { data } = await apiClient.get(endpoints.merchOrders.list, { params: status ? { status } : undefined });
    return data;
  },
  async updateStatus(id: string, status: string) {
    const { data } = await apiClient.patch(endpoints.merchOrders.updateStatus(id), { status });
    return data;
  },
};
