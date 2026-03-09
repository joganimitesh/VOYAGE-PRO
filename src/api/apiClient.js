// src/api/apiClient.js

import axios from "axios";

// ✅ Utility: Normalize trailing slashes in URLs
const normalizeBaseUrl = (url) => url.replace(/\/+$/, "");

// ✅ Exported base URL for global use
// Vite bakes VITE_API_BASE_URL into the build if provided.
// In production (Vercel/Render), it should be your backend URL.
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

// ✅ Fallback logic: 
// 1. If VITE_API_BASE_URL is set, use it.
// 2. If we are in production and it's missing, use "" (assumes same-origin or Nginx proxy).
// 3. In development, default to localhost:5001.
export const BASE_URL = normalizeBaseUrl(
  rawBaseUrl || (import.meta.env.PROD ? "" : "http://localhost:5001")
);

console.log(`[Voyage Pro] Using API Base URL: ${BASE_URL || "(current domain)"}`);

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
