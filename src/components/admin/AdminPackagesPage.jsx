import React, { useEffect, useState } from "react";
import apiClient, { BASE_URL } from "../../api/apiClient";
import { motion } from "framer-motion";
import { Edit, Trash2, Plus, Search } from "lucide-react";
import Button from "../ui/Button";
import { formatRupee } from "../../utils/format";
import { cn, getImageUrl } from "../../utils/helpers";
import { useNavigate } from "react-router-dom";

const AdminPackagesPage = () => {
  const [packages, setPackages] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showImage, setShowImage] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const navigate = useNavigate();

  // --- Fetch Packages ---
  const fetchPackages = async () => {
    try {
      const { data } = await apiClient.get("/packages/all-admin");
      setPackages(data);
      setFiltered(data);
    } catch (error) {
      console.error("❌ Error fetching packages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    let f = [...packages];
    if (category !== "All") {
      f = f.filter((p) => p.category === category);
    }
    if (search.trim()) {
      f = f.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFiltered(f);
  }, [search, category, packages]);

  const handleDelete = async (pkgId) => {
    if (!window.confirm("Are you sure you want to delete this package?")) return;
    setActionLoading(pkgId);
    try {
      await apiClient.delete(`/packages/${pkgId}`);
      await fetchPackages();
    } catch (error) {
      alert("Failed to delete package.");
    } finally {
      setActionLoading(null);
    }
  };

  const categories = [
    "All",
    "Adventure",
    "Family",
    "Luxury",
    "Beach",
    "Cultural",
    "Wildlife",
  ];

  return (
    <div className="p-4 md:p-8 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* --- PAGE TITLE --- */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 mb-8 text-center"
      >
        Manage Travel Packages
      </motion.h1>

      {/* --- FILTER BAR --- */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md flex flex-col lg:flex-row items-center justify-between gap-4 mb-8 border border-slate-100 dark:border-slate-700">
        {/* Search */}
        <div className="flex items-center gap-3 w-full lg:w-1/3">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search packages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-brand w-full dark:bg-slate-700 dark:text-slate-200"
          />
        </div>

        {/* Category + Add Button */}
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand w-full sm:w-auto dark:bg-slate-700 dark:text-slate-200"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat} Packages
              </option>
            ))}
          </select>

          <Button
            onClick={() => navigate("/admin/packages/add")}
            className="bg-brand hover:bg-brand-hover text-white font-semibold flex items-center gap-2 px-4 py-2 rounded-md w-full sm:w-auto shadow-brand/30"
          >
            <Plus size={16} /> Add New
          </Button>
        </div>
      </div>

      {/* --- PACKAGES GRID --- */}
      {loading ? (
        <p className="text-center text-slate-500 dark:text-slate-400">
          Loading packages...
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-slate-500 dark:text-slate-400">
          No packages found.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
          {filtered.map((pkg, i) => (
            <motion.div
              key={pkg._id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className={cn(
                "bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-2xl",
                "transform hover:-translate-y-2 transition-transform duration-300",
                "group",
                "flex flex-col" // Keep this
              )}
            >
              {/* --- Image --- */}
              <div className="relative overflow-hidden">
                <img
                  src={getImageUrl(pkg.image)}
                  alt={pkg.name}
                  className="w-full h-48 object-cover cursor-pointer group-hover:scale-110 transition-transform duration-500"
                  onClick={() => setShowImage(pkg.image)}
                />
              </div>

              {/* --- Package Info --- */}
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-1">
                  {pkg.name}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-3 line-clamp-2">
                  {pkg.description}
                </p>
                <p className="text-brand dark:text-brand-light font-semibold mb-2">
                  {formatRupee(pkg.price)} · {pkg.duration} Days
                </p>

                {/* ✅ FIX 1: Wrap Status and Actions in a new div with mt-auto */}
                <div className="mt-auto pt-4">
                  <span
                    className={cn(
                      "text-xs px-3 py-1 rounded-full font-semibold",
                      pkg.isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
                      "inline-block" // ✅ FIX 2: Stop span from stretching
                    )}
                  >
                    {pkg.isActive ? "Active" : "Inactive"}
                  </span>

                  {/* --- Actions --- */}
                  {/* ✅ FIX 3: Add normal top margin, remove mt-auto */}
                  <div className="flex flex-col sm:flex-row justify-start gap-2 mt-4">
                    <Button
                      onClick={() =>
                        navigate(`/admin/packages/edit/${pkg._id}`)
                      }
                      className="bg-brand hover:bg-brand-hover text-white px-3 py-1.5 text-sm w-full sm:w-auto"
                    >
                      <Edit size={14} /> Edit
                    </Button>

                    <Button
                      onClick={() => handleDelete(pkg._id)}
                      disabled={actionLoading === pkg._id}
                      variant="danger-ghost"
                      className={cn(
                        "px-3 py-1.5 text-sm w-full sm:w-auto disabled:opacity-50"
                      )}
                    >
                      <Trash2 size={14} /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* --- IMAGE PREVIEW MODAL --- */}
      {showImage && (
        <div
          onClick={() => setShowImage(null)}
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
        >
          <motion.img
            src={getImageUrl(showImage)}
            alt="Preview"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

export default AdminPackagesPage;