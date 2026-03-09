import React, { useState, useEffect, useMemo, useRef } from "react";
import apiClient, { BASE_URL } from "../../api/apiClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  Instagram,
  Facebook,
  Linkedin,
  Package,
  Camera,
  Settings,
  Grid,
  Bookmark,
  Heart,
  ExternalLink,
} from "lucide-react";
import Button from "../ui/Button";
import ProfileEditModal from "../ui/ProfileEditModal";
import { cn, getImageUrl, getAvatarUrl, DEFAULT_AVATAR } from "../../utils/helpers"; // ✅ Added DEFAULT_AVATAR
import { useNavigate } from "react-router-dom";
import PackageCard from "../ui/PackageCard";

// --- Main Profile Page ---
const MyProfilePage = ({
  onProfileUpdate,
  currentUser,
  applyTheme,
  handleLogout,
  handleSavePackage,
  handleUnsavePackage,
  savedPackageDetails,
  handleLikePackage,
  handleUnlikePackage,
  likedPackageDetails,
}) => {
  const [profile, setProfile] = useState(currentUser || null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("bookings");
  const navigate = useNavigate();
  const profileImageInputRef = useRef(null);
  const [imageUploading, setImageUploading] = useState(false);

  // --- Direct Profile Image Upload Handler ---
  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageUploading(true);
    const data = new FormData();
    data.append("name", profile.name);
    data.append("bio", profile.bio || "");
    const sl = profile.socialLinks || {};
    data.append("socialLinks[instagram]", sl.instagram || "");
    data.append("socialLinks[facebook]", sl.facebook || "");
    data.append("socialLinks[linkedin]", sl.linkedin || "");
    data.append("profileImageFile", file);

    try {
      const { data: updatedProfile } = await apiClient.post("/profile/update", data);
      handleProfileUpdateLocal(updatedProfile);
    } catch (err) {
      console.error("Failed to update profile image:", err);
    } finally {
      setImageUploading(false);
      e.target.value = "";
    }
  };

  const social = profile?.socialLinks || {};

  // --- Data Fetching ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const bookingsRes = await apiClient.get("/requests/mybookings");
      setBookings(bookingsRes.data.data || []);
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setProfile(currentUser);
  }, [currentUser]);

  // --- Handlers ---
  const handleProfileUpdateLocal = (updatedProfile) => {
    setProfile(updatedProfile);
    onProfileUpdate(updatedProfile);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    if (currentUser) {
      setProfile(currentUser);
    }
  };

  // --- Memoized Stats ---
  const stats = useMemo(() => {
    const totalTrips = bookings.length;
    const totalSaved = savedPackageDetails.length;
    const totalLiked = likedPackageDetails.length;
    return [
      { label: "Bookings", value: totalTrips },
      { label: "Saved", value: totalSaved },
      { label: "Liked", value: totalLiked },
    ];
  }, [bookings, savedPackageDetails, likedPackageDetails]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:text-slate-300">
        Loading profile...
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="pt-32 pb-24 container mx-auto px-6 max-w-5xl">
      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        currentUser={profile}
        onProfileUpdate={handleProfileUpdateLocal}
        applyTheme={applyTheme}
        handleLogout={handleLogout}
      />

      {/* --- PROFILE HEADER --- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row items-center gap-8 md:gap-16 mb-12"
      >
        {/* Profile Image */}
        <div
          className="relative w-40 h-40 md:w-48 md:h-48 flex-shrink-0 cursor-pointer group/avatar"
          onClick={() => profileImageInputRef.current?.click()}
          title="Change profile picture"
        >
          {/* Outer glow ring on hover */}
          <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-brand-light via-brand to-brand-hover opacity-0 group-hover/avatar:opacity-70 blur-sm transition-all duration-500" />
          <div className="relative w-full h-full">
            <img
              src={getAvatarUrl(profile.profileImage, profile.name)}
              alt="Profile"
              className="w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-lg transition-all duration-500 group-hover/avatar:scale-105"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = DEFAULT_AVATAR;
              }}
            />
            {/* Dark gradient overlay on hover */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover/avatar:opacity-100 transition-all duration-500" />
            {/* Camera icon + text */}
            <div className="absolute inset-0 rounded-full flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all duration-500 pointer-events-none">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 mb-1.5 shadow-lg border border-white/30">
                <Camera size={22} className="text-white" />
              </div>
              <span className="text-white text-xs font-semibold tracking-wide drop-shadow-md">Update Photo</span>
            </div>
          </div>
          {/* Uploading Spinner */}
          {imageUploading && (
            <div className="absolute inset-0 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="w-10 h-10 border-[3px] border-white/30 border-t-brand rounded-full animate-spin" />
            </div>
          )}
          {/* Hidden File Input */}
          <input
            ref={profileImageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleProfileImageUpload}
          />
        </div>

        {/* Profile Info & Stats */}
        <div className="text-center md:text-left flex-grow">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
            <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100">
              {profile.name}
            </h1>
            <Button
              onClick={() => setIsEditModalOpen(true)}
              variant="secondary"
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 shadow-none text-slate-800 dark:text-slate-200"
            >
              <Settings size={16} /> Edit Profile & Settings
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="flex justify-center md:justify-start gap-8 mb-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {stat.value}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Bio */}
          <p className="text-slate-700 dark:text-slate-300 max-w-xl mb-4">
            {profile.bio || "No bio available. Click 'Edit Profile' to add one."}
          </p>

          {/* Social Links with Brand Colors */}
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            {social.instagram && (
              <SocialLink
                href={social.instagram}
                icon={Instagram}
                className="hover:text-[#E1306C] dark:hover:text-[#E1306C]"
              />
            )}
            {social.facebook && (
              <SocialLink
                href={social.facebook}
                icon={Facebook}
                className="hover:text-[#1877F2] dark:hover:text-[#1877F2]"
              />
            )}
            {social.linkedin && (
              <SocialLink
                href={social.linkedin}
                icon={Linkedin}
                className="hover:text-[#0A66C2] dark:hover:text-[#0A66C2]"
              />
            )}
          </div>
        </div>
      </motion.div>
      {/* --- END PROFILE HEADER --- */}


      {/* --- 3-TAB INTERFACE --- */}
      <div className="w-full">
        {/* Tab Headers */}
        <div className="flex justify-center border-t border-slate-200 dark:border-slate-700">
          <TabButton
            icon={Grid}
            label="Bookings"
            isActive={activeTab === "bookings"}
            onClick={() => setActiveTab("bookings")}
          />
          <TabButton
            icon={Bookmark}
            label="Saved"
            isActive={activeTab === "saved"}
            onClick={() => setActiveTab("saved")}
          />
          <TabButton
            icon={Heart}
            label="Liked"
            isActive={activeTab === "liked"}
            onClick={() => setActiveTab("liked")}
          />
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "bookings" && (
                <BookingsGrid bookings={bookings} navigate={navigate} />
              )}
              {activeTab === "saved" && (
                <ContentGrid
                  packages={savedPackageDetails}
                  navigate={navigate}
                  currentUser={profile}
                  handleSavePackage={handleSavePackage}
                  handleUnsavePackage={handleUnsavePackage}
                  handleLikePackage={handleLikePackage}
                  handleUnlikePackage={handleUnlikePackage}
                  emptyIcon={Bookmark}
                  emptyMessage="No Saved Packages"
                  emptySubMessage="Click the bookmark icon on a package to save it here."
                />
              )}
              {activeTab === "liked" && (
                <ContentGrid
                  packages={likedPackageDetails}
                  navigate={navigate}
                  currentUser={profile}
                  handleSavePackage={handleSavePackage}
                  handleUnsavePackage={handleUnsavePackage}
                  handleLikePackage={handleLikePackage}
                  handleUnlikePackage={handleUnlikePackage}
                  emptyIcon={Heart}
                  emptyMessage="No Liked Packages"
                  emptySubMessage="Click the heart icon on a package to like it."
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// --- Helper Components ---

const SocialLink = ({ href, icon: Icon, className }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className={cn(
      "text-slate-500 dark:text-slate-400 transition-colors flex items-center gap-1",
      className
    )}
  >
    <Icon size={20} />
    <ExternalLink size={12} />
  </a>
);

const TabButton = ({ icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center justify-center gap-2 px-6 py-3 font-semibold border-t-2 transition-all -mt-px",
      isActive
        ? "border-slate-800 text-slate-800 dark:border-slate-200 dark:text-slate-200"
        : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
    )}
  >
    <Icon size={18} />
    <span className="hidden sm:block">{label}</span>
  </button>
);

// --- Empty State Component ---
const EmptyGrid = ({ icon: Icon, message, subMessage, navigate }) => (
  <div className="text-center p-12 bg-white dark:bg-slate-800 rounded-lg shadow-md border dark:border-slate-700">
    <Icon size={40} className="mx-auto text-slate-400 mb-4" />
    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">
      {message}
    </h3>
    <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6">
      {subMessage}
    </p>
    <Button className="mx-auto" onClick={() => navigate("/packages")}>Find Packages</Button>
  </div>
);

// --- Bookings Grid Component (Specific for Bookings) ---
const BookingsGrid = ({ bookings, navigate }) => {
  if (bookings.length === 0) {
    return (
      <EmptyGrid
        icon={Package}
        message="No Bookings Yet"
        subMessage="Your booked adventures will appear here."
        navigate={navigate}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-4">
      {bookings.map((booking, i) => (
        <motion.div
          key={booking._id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className="relative aspect-square rounded-lg sm:rounded-xl overflow-hidden cursor-pointer group"
          onClick={() => navigate(`/my-bookings/${booking._id}`)}
        >
          {booking.packageImage ? (
            <img
              src={`${BASE_URL}/${booking.packageImage}`}
              alt={booking.packageName}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
              <Package size={40} className="text-slate-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

          {/* ✅ --- START: UPDATED Booking Data Overlay --- */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
            <h4 className="font-bold text-white truncate max-w-full text-sm sm:text-base">
              {booking.packageName}
            </h4>
            {/* ✅ Added Travel Date */}
            <p className="text-xs text-slate-200 font-medium">
              {new Date(booking.date).toLocaleDateString("en-IN")}
            </p>
            <span
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block", // Added mt-1
                booking.status === "Approved" && "bg-green-500 text-white",
                booking.status === "Pending" && "bg-yellow-500 text-black",
                booking.status === "Cancelled" && "bg-gray-500 text-white",
                booking.status === "Rejected" && "bg-red-500 text-white"
              )}
            >
              {booking.status}
            </span>
          </div>
          {/* ✅ --- END: UPDATED Booking Data Overlay --- */}

        </motion.div>
      ))}
    </div>
  );
};

// --- Generic Content Grid (for Saved & Liked) ---
const ContentGrid = ({
  packages,
  navigate,
  currentUser,
  handleSavePackage,
  handleUnsavePackage,
  handleLikePackage,
  handleUnlikePackage,
  emptyIcon,
  emptyMessage,
  emptySubMessage,
}) => {
  if (packages.length === 0) {
    return (
      <EmptyGrid
        icon={emptyIcon}
        message={emptyMessage}
        subMessage={emptySubMessage}
        navigate={navigate}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-4">
      {packages.map((pkg, i) => (
        <motion.div
          key={pkg._id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className="relative aspect-square rounded-lg sm:rounded-xl overflow-hidden group"
        >
          <img
            src={`${BASE_URL}/${pkg.image}`}
            alt={pkg.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 cursor-pointer"
            onClick={() => navigate(`/packages/${pkg._id}`)}
          >
            <h4 className="font-bold text-white text-center text-lg">{pkg.name}</h4>
          </div>

          <PackageCardButtons
            pkg={pkg}
            currentUser={currentUser}
            handleSavePackage={handleSavePackage}
            handleUnsavePackage={handleUnsavePackage}
            handleLikePackage={handleLikePackage}
            handleUnlikePackage={handleUnlikePackage}
          />
        </motion.div>
      ))}
    </div>
  );
};

// --- Reusable Buttons for the 1:1 Grid ---
const PackageCardButtons = ({
  pkg,
  currentUser,
  handleSavePackage,
  handleUnsavePackage,
  handleLikePackage,
  handleUnlikePackage,
}) => {
  const isSaved = currentUser?.savedPackages?.includes(pkg._id);
  const isLiked = currentUser?.likedPackages?.includes(pkg._id);

  const onSaveClick = (e) => {
    e.stopPropagation();
    if (!currentUser) return alert("Please log in to save packages.");
    isSaved ? handleUnsavePackage(pkg._id) : handleSavePackage(pkg._id);
  };

  const onLikeClick = (e) => {
    e.stopPropagation();
    if (!currentUser) return alert("Please log in to like packages.");
    isLiked ? handleUnlikePackage(pkg._id) : handleLikePackage(pkg._id);
  };

  return (
    <>
      <button
        onClick={onSaveClick}
        className={cn(
          "absolute top-2 right-12 p-2 rounded-full bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm",
          "hover:scale-110 transition-all text-slate-700 dark:text-slate-200"
        )}
        title={isSaved ? "Unsave" : "Save"}
      >
        <Bookmark size={18} className={cn(isSaved && "fill-brand text-brand")} />
      </button>
      <button
        onClick={onLikeClick}
        className={cn(
          "absolute top-2 right-2 p-2 rounded-full bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm",
          "hover:scale-110 transition-all text-slate-700 dark:text-slate-200"
        )}
        title={isLiked ? "Unlike" : "Like"}
      >
        <Heart size={18} className={cn(isLiked && "fill-red-500 text-red-500")} />
      </button>
    </>
  );
};

export default MyProfilePage;