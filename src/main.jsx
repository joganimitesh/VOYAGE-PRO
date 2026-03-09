// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// ✅ FIX: Use sessionStorage (tab-specific)
(() => {
  const html = document.documentElement;
  const pathname = window.location.pathname;

  // Remove any previous theme before applying a new one
  html.classList.remove("light", "dark");

  if (pathname.startsWith("/admin")) {
    // Admin section:
    const savedTheme = sessionStorage.getItem("voyage-admin-theme") || "light";
    html.classList.add(savedTheme);
  } else {
    // ----- THIS IS THE CORRECTION -----
    // User section: Load the user's theme for THIS TAB (default to light)
    const savedTheme = sessionStorage.getItem("voyage-user-theme") || "light";
    // ----- END OF CORRECTION -----
    html.classList.add(savedTheme);
  }
})();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
