import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";

export const paymentsService = {
  async getSettings(): Promise<{ data: { enabled: boolean } }> {
    const { data } = await apiClient.get(endpoints.adminPayments.settings);
    return data;
  },

  async setEnabled(enabled: boolean): Promise<{ data: { enabled: boolean } }> {
    const { data } = await apiClient.patch(endpoints.adminPayments.settings, { enabled });
    return data;
  },
};
