import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";

export const uploadsService = {
  async upload(file: File, folder: "albums" | "tracks" | "events" | "gallery" | "products"): Promise<string> {
    const { data } = await apiClient.post(endpoints.adminUploads.presign, {
      filename: file.name,
      contentType: file.type,
      folder,
    });

    const { uploadUrl, publicUrl } = data.data;

    const res = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });
    if (!res.ok) throw new Error("Upload to storage failed");

    return publicUrl;
  },
};
