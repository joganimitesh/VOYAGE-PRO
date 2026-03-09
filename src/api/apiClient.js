// src/api/apiClient.js

import axios from "axios";

// ✅ Utility: Normalize trailing slashes in URLs
const normalizeBaseUrl = (url) => url.replace(/\/+$/, "");

// ✅ Exported base URL for global use (e.g., image paths)
// Use empty string in production (which delegates to Nginx proxy) or localhost in dev
export const BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.PROD ? "" : "http://localhost:5001")
);

// ✅ Create a pre-configured Axios instance
const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  // Headers will be automatically handled by Axios for FormData
  timeout: 10000,
});

// ✅ Interceptor to attach tokens to every request
apiClient.interceptors.request.use((config) => {
  const userToken = sessionStorage.getItem("userAuthToken");
  const adminToken = sessionStorage.getItem("adminAuthToken");

  // ✅ Prioritize admin token if available
  const token = adminToken || userToken;

  if (token) {
    // ✅ FIX: Use 'x-auth-token' header for consistency with backend middleware
    config.headers["x-auth-token"] = token;
  }

  // 🧹 Remove legacy or incorrect Authorization header if present
  if (config.headers.Authorization) {
    delete config.headers.Authorization;
  }

  return config;
});

export default apiClient;
