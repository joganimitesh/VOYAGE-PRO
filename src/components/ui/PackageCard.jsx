// src/components/ui/PackageCard.jsx
import React from "react";
import { motion } from "framer-motion";
import { MapPin, Star, ArrowRight, Bookmark, Heart } from "lucide-react"; // ✅ Add Heart
import { formatRupee } from "../../utils/format";
import { cn, getImageUrl } from "../../utils/helpers";
import { BASE_URL } from "../../api/apiClient";

const PackageCard = ({
  pkg,
  index,
  onViewDetails,
  currentUser,
  handleSavePackage,
  handleUnsavePackage,
  // ✅ --- START: Add "Liked" props ---
  handleLikePackage,
  handleUnlikePackage,
  // ✅ --- END: Add "Liked" props ---
}) => {
  const isSaved = currentUser?.savedPackages?.includes(pkg._id);
  // ✅ Check if the package is liked
  const isLiked = currentUser?.likedPackages?.includes(pkg._id);

  const onSaveClick = (e) => {
    e.stopPropagation(); // Don't trigger card click
    if (!currentUser) {
      alert("Please log in to save packages.");
      return;
    }
    if (isSaved) {
      handleUnsavePackage(pkg._id);
    } else {
      handleSavePackage(pkg._id);
    }
  };

  // ✅ --- START: New "Like" click handler ---
  const onLikeClick = (e) => {
    e.stopPropagation();
    if (!currentUser) {
      alert("Please log in to like packages.");
      return;
    }
    if (isLiked) {
      handleUnlikePackage(pkg._id);
    } else {
      handleLikePackage(pkg._id);
    }
  };
  // ✅ --- END: New "Like" click handler ---


  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={cn(
        "bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden",
        "border border-slate-100 dark:border-slate-700 flex flex-col group",
        "transform hover:-translate-y-2 transition-transform duration-300"
      )}
    >
      {/* --- Package Image --- */}
      <div className="relative overflow-hidden">
        <img
          src={getImageUrl(pkg.image)}
          alt={pkg.name}
          className="w-full aspect-[3/2] object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://placehold.co/600x400/cccccc/ffffff?text=Image+Error";
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* --- Duration Tag --- */}
        <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/80 text-brand dark:text-brand-light px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm">
          {pkg.duration || "N/A"} Days
        </div>

        {/* --- Action Buttons --- */}
        <div className="absolute top-4 left-4 flex gap-2">
          {/* Save Button */}
          {handleSavePackage && handleUnsavePackage && (
            <button
              onClick={onSaveClick}
              className={cn(
                "p-2 rounded-full bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm",
                "hover:scale-110 transition-all text-slate-700 dark:text-slate-200"
              )}
              title={isSaved ? "Unsave Package" : "Save Package"}
            >
              <Bookmark
                size={20}
                className={cn(isSaved && "fill-brand text-brand")}
              />
            </button>
          )}
          {/* ✅ --- START: New "Like" Button --- */}
          {handleLikePackage && handleUnlikePackage && (
            <button
              onClick={onLikeClick}
              className={cn(
                "p-2 rounded-full bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm",
                "hover:scale-110 transition-all text-slate-700 dark:text-slate-200"
              )}
              title={isLiked ? "Unlike Package" : "Like Package"}
            >
              <Heart
                size={20}
                className={cn(isLiked && "fill-red-500 text-red-500")}
              />
            </button>
          )}
          {/* ✅ --- END: New "Like" Button --- */}
        </div>
      </div>

      {/* --- Card Content --- */}
      <div className="p-6 flex flex-col flex-grow">
        {/* ... (Rest of the card content remains the same) ... */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {pkg.name || "Untitled Package"}
          </h3>
          <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 px-2 py-1 rounded-full text-sm font-semibold">
            <Star size={14} className="fill-current" />
            <span>{pkg.rating?.toFixed(1) || "4.5"}</span>
          </div>
        </div>
        <p className="text-sm flex items-center text-slate-500 dark:text-slate-400 mb-4">
          <MapPin size={14} className="mr-1.5 flex-shrink-0" />
          {pkg.location || pkg.category || "Unknown Location"}
        </p>
        <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 flex-grow leading-relaxed">
          {pkg.description?.substring(0, 90) || "No description available."}...
        </p>
        <div className="flex justify-between items-center mt-auto">
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {formatRupee(pkg.price)}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
              /person
            </span>
          </div>
          <button
            onClick={() => onViewDetails(pkg)}
            className="font-semibold text-brand dark:text-brand-light hover:text-brand-hover dark:hover:text-brand-light/80 flex items-center gap-1 group/link"
          >
            Details
            <ArrowRight
              size={16}
              className="transition-transform group-hover/link:translate-x-1"
            />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PackageCard;