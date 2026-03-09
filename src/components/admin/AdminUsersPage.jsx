// src/components/admin/AdminUsersPage.jsx

import React, { useEffect, useState } from "react";
import apiClient, { BASE_URL } from "../../api/apiClient";
import { motion } from "framer-motion";
import { ShieldX, ShieldCheck, Search, Mail, Phone, Info } from "lucide-react";
import Button from "../ui/Button";
import { cn, getImageUrl, getAvatarUrl, DEFAULT_AVATAR } from "../../utils/helpers"; // ✅ Added getAvatarUrl
import UserInsightsModal from "./UserInsightsModal";

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // ✅ Fetch Users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/admin-users");
      setUsers(Array.isArray(data.data) ? data.data : []);
      setFiltered(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error("❌ Error fetching users:", error);
      alert("Failed to fetch users. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ✅ Search Filter
  useEffect(() => {
    const f = users.filter(
      (u) =>
        (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(f);
  }, [search, users]);

  // ✅ Block / Unblock Logic
  const handleBlockToggle = async (userId, isBlocked) => {
    const confirmMsg = isBlocked ? "Unblock this user?" : "Block this user?";
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(userId);
    try {
      const endpoint = isBlocked
        ? `/admin-users/${userId}/unblock`
        : `/admin-users/${userId}/block`;
      await apiClient.patch(endpoint);

      // ✅ Update local list state optimistically or after fetch
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBlocked: !isBlocked } : u));

      // ✅ Update currently selected user for the modal immediately
      if (selectedUser && selectedUser._id === userId) {
        setSelectedUser(prev => ({ ...prev, isBlocked: !isBlocked }));
      }

      fetchUsers(); // Keep basic fetch for consistency
    } catch (err) {
      console.error("❌ Failed to toggle user status:", err);
      alert("Could not update user status. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-slate-100 dark:bg-slate-900 min-h-screen">
      {/* 🏷️ Page Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 mb-8 text-center"
      >
        Manage Users
      </motion.h1>

      {/* 🔍 Search Bar */}
      <div className="flex items-center gap-3 mb-8 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full outline-none bg-transparent placeholder-slate-400 dark:text-slate-200 dark:placeholder-slate-400 border-0 focus:ring-0 dark:bg-transparent"
        />
      </div>

      {/* 🧾 User Data */}
      {loading ? (
        <p className="text-center text-slate-500 dark:text-slate-400">
          Loading users...
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-slate-500 dark:text-slate-400">
          No users found.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((user, i) => (
            <motion.div
              key={user._id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className={cn(
                "bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border relative overflow-hidden transition-all duration-300 hover:shadow-lg group",
                user.isBlocked
                  ? "border-red-300 dark:border-red-600"
                  : "border-slate-200 dark:border-slate-700"
              )}
            >
              {/* ✅ INFO BUTTON */}
              <button
                onClick={() => setSelectedUser(user)}
                className="absolute top-4 right-4 text-slate-400 hover:text-brand dark:hover:text-brand-light transition-colors"
                title="View Insights"
              >
                <Info size={20} />
              </button>

              {/* 🧑 User Info */}
              <div className="flex items-center gap-4">
                <img
                  src={getAvatarUrl(user.profileImage, user.name)}
                  alt={user.name}
                  className="w-16 h-16 rounded-full object-cover shrink-0 border-2 border-slate-200 dark:border-slate-600 shadow-sm"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_AVATAR;
                  }}
                />
                <div className="min-w-0 pr-8">

                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {user.name || "Unknown User"}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2 truncate">
                    <Mail size={14} className="flex-shrink-0" />
                    <span className="truncate">{user.email || "N/A"}</span>
                  </p>
                  {user.phone && (
                    <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2">
                      <Phone size={14} className="flex-shrink-0" /> {user.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* ⚙️ User Actions */}
              <div className="mt-5 flex items-center justify-between">
                <span
                  className={cn(
                    "px-3 py-1 text-xs font-semibold rounded-full border",
                    user.isBlocked
                      ? "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-700"
                      : "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-700"
                  )}
                >
                  {user.isBlocked ? "Blocked" : "Active"}
                </span>

                <Button
                  onClick={() => handleBlockToggle(user._id, user.isBlocked)}
                  disabled={actionLoading === user._id}
                  className={cn(
                    "flex items-center gap-2 text-sm font-semibold rounded-md px-3 py-1.5 transition-all duration-200",
                    user.isBlocked
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  )}
                >
                  {user.isBlocked ? (
                    <>
                      <ShieldCheck size={14} /> Unblock
                    </>
                  ) : (
                    <>
                      <ShieldX size={14} /> Block
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      {/* ✅ User Insights Modal */}
      {selectedUser && (
        <UserInsightsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onToggleBlockStatus={handleBlockToggle}
        />
      )}
    </div>
  );
};
export default AdminUsersPage;
