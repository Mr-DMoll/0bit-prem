import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";

const DEVICE_ID_KEY = "premvkay_device_id";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export const sessionsService = {
  async claim(deviceId: string) {
    const { data } = await apiClient.post(endpoints.sessions.claim, { deviceId });
    return data;
  },
  async check(deviceId: string): Promise<{ data: { active: boolean } }> {
    const { data } = await apiClient.post(endpoints.sessions.check, { deviceId });
    return data;
  },
};
