import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Filter, IndianRupee } from "lucide-react";
import { formatRupee } from "../../utils/format";
import apiClient from "../../api/apiClient";
import Button from "../ui/Button";
import PackageCard from "../ui/PackageCard";
import { cn } from "../../utils/helpers";

const PackagesPage = ({
  packages: initialPackages,
  currentUser,
  handleSavePackage,
  handleUnsavePackage,
  // ✅ --- START: Add "Liked" props ---
  handleLikePackage,
  handleUnlikePackage,
  // ✅ --- END: Add "Liked" props ---
}) => {
  const [packages, setPackages] = useState(initialPackages || []);
  const [loading, setLoading] = useState(!initialPackages?.length);

  // Calculate the max price dynamically from the packages
  const maxPrice = useMemo(() => {
    if (!packages || packages.length === 0) {
      return 100000; // Default max if no packages are loaded
    }
    const prices = packages.map((p) => p.price);
    // Find the highest price and round it up to the nearest 1000
    return Math.ceil(Math.max(...prices) / 1000) * 1000;
  }, [packages]);

  // Set the initial filter state
  const [filters, setFilters] = useState({
    search: "",
    category: "All",
    price: maxPrice, // Set initial price to the max
    duration: "All",
    sortOrder: "default",
  });

  // Update the filter's price to the new maxPrice when packages load
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      price: maxPrice,
    }));
  }, [maxPrice]);

  const navigate = useNavigate();
  const location = useLocation(); // ✅ Get location to forward state

  // --- Fetch Packages ---
  useEffect(() => {
    if (!initialPackages?.length) {
      setLoading(true);
      (async () => {
        try {
          const { data } = await apiClient.get("/packages");
          setPackages(data);
        } catch (err) {
          console.error("Error fetching packages:", err);
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setPackages(initialPackages);
    }
  }, [initialPackages]);

  // --- Handle Filter Change ---
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // --- Filter Logic ---
  const filtered = useMemo(() => {
    let filteredData = [...packages];
    const { search, category, duration, price, sortOrder } = filters;

    if (search.trim()) {
      filteredData = filteredData.filter(
        (pkg) =>
          pkg.name.toLowerCase().includes(search.toLowerCase()) ||
          (pkg.location &&
            pkg.location.toLowerCase().includes(search.toLowerCase()))
      );
    }

    if (category !== "All") {
      filteredData = filteredData.filter((pkg) => pkg.category === category);
    }

    if (duration !== "All") {
      filteredData = filteredData.filter((pkg) => {
        const days = parseInt(pkg.duration, 10) || 0;
        if (duration === "Short") return days <= 3;
        if (duration === "Medium") return days > 3 && days <= 7;
        if (duration === "Long") return days > 7;
        return true;
      });
    }

    filteredData = filteredData.filter((pkg) => pkg.price <= price);

    if (sortOrder === "low-high") {
      filteredData.sort((a, b) => a.price - b.price);
    } else if (sortOrder === "high-low") {
      filteredData.sort((a, b) => b.price - a.price);
    }

    return filteredData;
  }, [filters, packages]);

  const categories = [
    "All",
    "Adventure",
    "Family",
    "Luxury",
    "Beach",
    "Cultural",
    "Wildlife",
  ];

  const durations = ["All", "Short (1-3d)", "Medium (4-7d)", "Long (7d+)"];

  return (
    <div className="pt-32 pb-24 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* --- Page Title --- */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-5xl font-extrabold text-center mb-6 text-slate-800 dark:text-slate-100"
        >
          Explore Our Packages
        </motion.h1>

        <p className="text-xl text-slate-600 dark:text-slate-300 text-center mb-12 max-w-3xl mx-auto">
          Find your perfect escape — from serene getaways to thrilling
          adventures.
        </p>

        {/* --- Filters Section --- */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg mb-12 border border-slate-100 dark:border-slate-700 backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="relative w-full md:w-1/3">
              <Search
                size={18}
                className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10"
              />
              <input
                type="text"
                name="search"
                placeholder="Search packages..."
                value={filters.search}
                onChange={handleFilterChange}
                className={cn(
                  "w-full pl-10 pr-4 py-2 rounded-md outline-none transition-all duration-200",
                  "bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm",
                  "border border-slate-300 dark:border-slate-700",
                  "text-slate-700 dark:text-slate-200",
                  "focus:ring-2 focus:ring-brand/50 focus:border-brand"
                )}
              />
            </div>

            {/* Category */}
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="border border-slate-300 rounded-md px-3 py-2 text-slate-700 focus:ring-2 focus:ring-brand w-full md:w-auto dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} Trips
                </option>
              ))}
            </select>

            {/* Duration */}
            <select
              name="duration"
              value={filters.duration}
              onChange={handleFilterChange}
              className="border border-slate-300 rounded-md px-3 py-2 text-slate-700 focus:ring-2 focus:ring-brand w-full md:w-auto dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
            >
              {durations.map((dur) => (
                <option key={dur} value={dur.split(" ")[0]}>
                  {dur}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              name="sortOrder"
              value={filters.sortOrder}
              onChange={handleFilterChange}
              className="border border-slate-300 rounded-md px-3 py-2 text-slate-700 focus:ring-2 focus:ring-brand w-full md:w-auto dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
            >
              <option value="default">Sort by</option>
              <option value="low-high">Price: Low → High</option>
              <option value="high-low">Price: High → Low</option>
            </select>
          </div>

          {/* Price Range */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Filter size={16} /> Price Range (Max):
            </div>

            <input
              type="range"
              name="price"
              min="0"
              max={maxPrice}
              step="1000"
              value={filters.price}
              onChange={handleFilterChange}
              className="w-full sm:w-1/2 accent-brand"
            />

            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {formatRupee(filters.price)}
            </span>
          </div>
        </div>

        {/* --- Packages Grid --- */}
        {loading ? (
          <p className="text-center text-slate-500 dark:text-slate-400">
            Loading packages...
          </p>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {filtered.map((pkg, i) => (
              <PackageCard
                key={pkg._id || i}
                pkg={pkg}
                index={i}
                onViewDetails={(pkg) =>
                  navigate(`/packages/${pkg._id}`, { state: location.state })
                }
                // ✅ --- START: Pass all props ---
                currentUser={currentUser}
                handleSavePackage={handleSavePackage}
                handleUnsavePackage={handleUnsavePackage}
                handleLikePackage={handleLikePackage}
                handleUnlikePackage={handleUnlikePackage}
              // ✅ --- END: Pass all props ---
              />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center bg-white dark:bg-slate-800 p-12 rounded-xl shadow-md border border-slate-100 dark:border-slate-700"
          >
            <IndianRupee size={42} className="mx-auto text-slate-400 mb-3" />
            <h3 className="text-2xl font-semibold text-slate-700 dark:text-slate-200">
              No Packages Found
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Try adjusting your filters or search keywords.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PackagesPage;