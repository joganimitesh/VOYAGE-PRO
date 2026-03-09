// src/components/admin/AdminPage.jsx

import React, { useState } from "react";
// ✅ FIX: Import Outlet, remove Routes and Route
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  ClipboardList,
  MessageSquare,
  IndianRupee,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "../../utils/helpers";
import AdminThemeToggle from "./AdminThemeToggle";
import logo from "../../assets/voyage-logo-new.png";

const AdminPage = ({ applyTheme }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      sessionStorage.removeItem("adminAuthToken");
      window.location.href = "/admin/login";
    }
  };

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/admin",
      isLink: true,
    },
    { id: "management", label: "Management", isLink: false },
    {
      id: "packages",
      label: "Packages",
      icon: Package,
      path: "/admin/packages",
      isLink: true,
    },
    {
      id: "requests",
      label: "Requests",
      icon: ClipboardList,
      path: "/admin/requests",
      isLink: true,
    },
    {
      id: "team",
      label: "Team",
      icon: Users,
      path: "/admin/team",
      isLink: true,
    },
    {
      id: "users",
      label: "Users",
      icon: Users,
      path: "/admin/users",
      isLink: true,
    },
    { id: "communication", label: "Communication", isLink: false },
    {
      id: "responses",
      label: "Responses",
      icon: MessageSquare,
      path: "/admin/responses",
      isLink: true,
    },
    {
      id: "transactions",
      label: "Transactions",
      icon: IndianRupee,
      path: "/admin/transactions",
      isLink: true,
    },
  ];

  const getActiveTab = () => {
    const currentPath = location.pathname;

    if (currentPath === "/admin") {
      return "dashboard";
    }

    const matchingItem = navItems
      .filter((item) => item.isLink && item.id !== "dashboard")
      .sort((a, b) => b.path.length - a.path.length)
      .find((item) => currentPath.startsWith(item.path));

    return matchingItem ? matchingItem.id : "dashboard";
  };

  const activeTab = getActiveTab();

  return (
    <div className="bg-slate-100 dark:bg-slate-900 flex h-screen overflow-hidden">
      {/* 🧭 Sidebar */}
      <aside
        className={cn(
          "fixed md:static z-50 inset-y-0 left-0 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 shadow-lg flex flex-col transition-transform duration-300",
          "h-full",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center border-2 border-slate-200 dark:border-slate-700 bg-white shadow-sm flex-shrink-0">
              <img
                src={logo}
                alt="Logo"
                className="w-full h-full object-cover scale-[2.0]"
              />
            </div>
            <h2 className="text-xl font-bold text-brand dark:text-brand-light">
              Voyage Pro
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <AdminThemeToggle applyTheme={applyTheme} />
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-slate-600 dark:text-slate-300 hover:text-slate-800"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) =>
            item.isLink ? (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-2.5 rounded-lg transition-all transform",
                  activeTab === item.id
                    ? "bg-brand text-white shadow-md font-semibold"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:translate-x-1"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ) : (
              <h4
                key={item.id}
                className="text-xs font-semibold text-slate-400 uppercase pt-4 pb-1 px-4"
              >
                {item.label}
              </h4>
            )
          )}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-all"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* 📱 Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-40 md:hidden bg-brand text-white p-2 rounded-lg shadow-md"
      >
        <Menu size={22} />
      </button>

      {/* 📋 Main Content */}
      <main className="flex-1 transition-all duration-300 overflow-y-auto bg-slate-50 dark:bg-slate-900">
        <div className="pt-20 md:pt-0 min-h-screen">
          {/* ✅ FIX: Replaced the <Routes> block with <Outlet /> */}
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
