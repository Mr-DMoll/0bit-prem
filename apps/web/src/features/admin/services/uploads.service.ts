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

  // XHR (not fetch) specifically to get upload.onprogress events for a progress bar.
  async uploadWithProgress(
    file: File,
    folder: "albums" | "tracks" | "events" | "gallery" | "products",
    onProgress: (percent: number) => void
  ): Promise<string> {
    const { data } = await apiClient.post(endpoints.adminUploads.presign, {
      filename: file.name,
      contentType: file.type,
      folder,
    });
    const { uploadUrl, publicUrl } = data.data;

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error("Upload to storage failed"));
      };
      xhr.onerror = () => reject(new Error("Upload to storage failed"));
      xhr.send(file);
    });

    return publicUrl;
  },
};
