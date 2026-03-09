// src/components/layout/Layout.jsx

import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { cn } from "../../utils/helpers"; // ✅ ADDED

const Layout = ({
  userProfile,
  handleLogout,
  isUserAuthenticated,
  isAdminAuthenticated,
  currentUser,
  applyTheme,
}) => {
  return (
    // ✅ FIX: Added dark mode class here
    <div
      className={cn(
        "bg-slate-50 text-slate-800 font-sans",
        "dark:bg-slate-900 dark:text-slate-200"
      )}
    >
      <Navbar
        isUserAuthenticated={isUserAuthenticated}
        isAdminAuthenticated={isAdminAuthenticated}
        currentUser={currentUser}
        userProfile={userProfile}
        handleLogout={handleLogout}
        applyTheme={applyTheme}
      />

      <main>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default Layout;
