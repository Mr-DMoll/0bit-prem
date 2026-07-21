// ─────────────────────────────────────────────────────────────────────────────
// API CLIENT — Mobile + Desktop compatible
// withCredentials sends cookies for desktop
// Authorization header sends token for mobile Safari + Brave
// The backend protect middleware accepts either — whichever arrives wins
// ─────────────────────────────────────────────────────────────────────────────

import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

const apiClient = axios.create({
  baseURL: `${BASE_URL}`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Attach token from localStorage to every request
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Routes that require an authenticated session — a 401 here means "your
// session died, go log in." A 401 anywhere else (e.g. the public Premvkay
// app checking "am I logged in?" on mount) is a normal logged-out state,
// not an error, so it must not force a redirect away from public pages.
const PROTECTED_PATH_PREFIXES = ["/admin", "/manager", "/super-admin"];

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      const { pathname } = window.location;
      const inProtectedArea = PROTECTED_PATH_PREFIXES.some((p) => pathname.startsWith(p));
      // Super Admin's login route is private/unlisted — only that subtree
      // bounces there; admin/manager land on the public site's Google button.
      const loginPath = pathname.startsWith("/super-admin") ? "/console-0726" : "/";
      // Avoid a redirect loop on the login page itself
      if (inProtectedArea && pathname !== loginPath) {
        window.location.replace(loginPath);
      }
    }
    return Promise.reject(err);
  },
);

export default apiClient;
