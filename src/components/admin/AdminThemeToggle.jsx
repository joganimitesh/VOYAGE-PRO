// src/components/admin/AdminThemeToggle.jsx

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { cn } from "../../utils/helpers";

const AdminThemeToggle = ({ applyTheme }) => {
  // ✅ FIX: Default state is now 'light'
  const [theme, setTheme] = useState(() => {
    return sessionStorage.getItem("voyage-admin-theme") || "light";
  });

  // Apply theme once when component mounts
  useEffect(() => {
    applyTheme(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    sessionStorage.setItem("voyage-admin-theme", newTheme);
    applyTheme(newTheme);
  };

  return (
    <div className="flex items-center justify-center">
      <button
        onClick={toggleTheme}
        className={cn(
          "relative w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors",
          theme === "light" ? "bg-brand" : "bg-slate-700"
        )}
      >
        {/* Animated Background Circle */}
        <motion.div
          className="absolute w-5 h-5 bg-white rounded-full z-10"
          layout
          transition={{ type: "spring", stiffness: 700, damping: 30 }}
          style={{
            left: theme === "light" ? "4px" : "calc(100% - 24px)", // ✅ FIX: Swapped positions
          }}
        />

        {/* Icons */}
        <div className="relative w-full h-full flex items-center justify-between px-0.5">
          <Sun size={14} className="text-yellow-400" /> {/* ✅ FIX: Swapped positions */}
          <Moon size={14} className="text-white" />
        </div>
      </button>
    </div>
  );
};

export default AdminThemeToggle;
