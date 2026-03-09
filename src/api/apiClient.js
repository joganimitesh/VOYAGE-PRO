// src/api/apiClient.js

import axios from "axios";

// ✅ Utility: Normalize trailing slashes in URLs
const normalizeBaseUrl = (url) => url.replace(/\/+$/, "");

const getBaseUrl = () => {
  // 1. Priority: Environment Variable
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;

  // 2. Fallback: Check if we are on localhost
  const isLocal = window.location.hostname === "localhost" || 
                  window.location.hostname === "127.0.0.1" || 
                  window.location.hostname.startsWith("192.168.");
  
  if (isLocal) return "http://localhost:5001";

  // 3. Final Fallback: Production Render URL
  return "https://voyage-pro-4.onrender.com";
};

export const BASE_URL = normalizeBaseUrl(getBaseUrl());

console.log(`[Voyage Pro] API Path: ${BASE_URL}/api`);

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
