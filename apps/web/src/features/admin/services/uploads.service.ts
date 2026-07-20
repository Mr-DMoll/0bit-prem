import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";

// Must match R2_CACHE_CONTROL in apps/api/src/services/s3.service.ts — it's part
// of the presigned PutObjectCommand's signed headers, so the client must send it exactly.
const R2_CACHE_CONTROL = "public, max-age=31536000, immutable";

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
      headers: { "Content-Type": file.type, "Cache-Control": R2_CACHE_CONTROL },
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
      xhr.setRequestHeader("Cache-Control", R2_CACHE_CONTROL);
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

  // Track audio goes through the API server (not a direct-to-R2 presigned PUT) so
  // it can be transcoded from whatever the admin uploads (often lossless FLAC/WAV)
  // down to a much smaller compressed format before it's stored.
  async uploadTrack(file: File, onProgress: (percent: number) => void): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const publicUrl = await new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${apiClient.defaults.baseURL}${endpoints.adminUploads.track}`);
      xhr.withCredentials = true;
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.upload.onprogress = (e) => {
        // Upload leg only goes to 90% — the remaining 10% covers server-side transcoding,
        // which happens after the raw bytes finish arriving but before the response returns.
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 90));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress(100);
          resolve(JSON.parse(xhr.responseText).data.publicUrl);
        } else {
          reject(new Error("Track upload failed"));
        }
      };
      xhr.onerror = () => reject(new Error("Track upload failed"));
      xhr.send(formData);
    });

    return publicUrl;
  },
};
