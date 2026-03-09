import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  User,
  Settings,
  AlertTriangle,
  Sun,
  Moon,
  LogOut,
  Palette,
  Lock,
} from "lucide-react";
import apiClient, { BASE_URL } from "../../api/apiClient";
import InputField from "./InputField";
import Button from "./Button";
import { cn, getImageUrl, getAvatarUrl, DEFAULT_AVATAR } from "../../utils/helpers"; // ✅ Added DEFAULT_AVATAR

const ProfileEditModal = ({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdate,
  applyTheme,
  handleLogout,
}) => {
  const modalContentRef = useRef(null);
  const [activeTab, setActiveTab] = useState("profile");

  const [theme, setTheme] = useState(() => {
    return sessionStorage.getItem("voyage-user-theme") || "light";
  });

  const [formData, setFormData] = useState({
    name: currentUser.name || "",
    bio: currentUser.bio || "",
    instagram: currentUser.socialLinks?.instagram || "",
    facebook: currentUser.socialLinks?.facebook || "",
    linkedin: currentUser.socialLinks?.linkedin || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [profileImageFile, setProfileImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  // Background scroll lock
  useEffect(() => {
    if (isOpen) {
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = 'auto';
    }
    return () => {
      document.documentElement.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Scroll to top to show messages
  const scrollToTop = () => {
    if (modalContentRef.current) {
      modalContentRef.current.scrollTop = 0;
    }
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab("profile");
      setFormData({
        name: currentUser.name || "",
        bio: currentUser.bio || "",
        instagram: currentUser.socialLinks?.instagram || "",
        facebook: currentUser.socialLinks?.facebook || "",
        linkedin: currentUser.socialLinks?.linkedin || "",
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setProfileImageFile(null);
      setImagePreview(null);
      setError("");
      setSuccess("");
    }
  }, [currentUser, isOpen]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handlePasswordChange = (e) =>
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    scrollToTop();

    const data = new FormData();
    data.append("name", formData.name);
    data.append("bio", formData.bio);
    data.append("socialLinks[instagram]", formData.instagram);
    data.append("socialLinks[facebook]", formData.facebook);
    data.append("socialLinks[linkedin]", formData.linkedin);
    if (profileImageFile) data.append("profileImageFile", profileImageFile);

    try {
      const { data: updatedProfile } = await apiClient.post("/profile/update", data);
      onProfileUpdate(updatedProfile);
      setSuccess("Profile updated successfully!");
      setProfileImageFile(null);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    scrollToTop();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setError("New passwords do not match.");
    }
    if (passwordData.newPassword.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    try {
      const { data } = await apiClient.post("/profile/change-password", passwordData);
      setSuccess(data.msg);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to change password.");
    }
  };

  const handleThemeChange = (mode) => {
    setTheme(mode);
    sessionStorage.setItem("voyage-user-theme", mode);
    applyTheme(mode);
  };

  const handleLocalLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      handleLogout("user");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      >
        {/* Main Modal Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col"
        >
          {/* --- Header with Tabs --- */}
          <div className="flex justify-between items-center p-6 border-b dark:border-slate-700">
            <div className="flex gap-2">
              <TabButton
                label="Profile"
                icon={User}
                isActive={activeTab === "profile"}
                onClick={() => setActiveTab("profile")}
              />
              <TabButton
                label="Settings"
                icon={Settings}
                isActive={activeTab === "settings"}
                onClick={() => setActiveTab("settings")}
              />
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <X size={24} />
            </button>
          </div>

          {/* --- Scrollable Content Area --- */}
          <div ref={modalContentRef} className="overflow-y-auto p-6">
            {/* --- Alerts (at the top) --- */}
            {error && (
              <p className="text-red-500 bg-red-50 dark:bg-red-900/30 p-3 rounded-md text-sm mb-4 border border-red-200 dark:border-red-700">
                {error}
              </p>
            )}
            {success && (
              <p className="text-green-600 bg-green-50 dark:bg-green-900/30 p-3 rounded-md text-sm mb-4 border border-green-200 dark:border-green-700">
                {success}
              </p>
            )}

            {/* --- Tab Content --- */}
            {activeTab === "profile" ? (
              <ProfileForm
                formData={formData}
                imagePreview={imagePreview}
                currentUser={currentUser}
                fileInputRef={fileInputRef}
                handleChange={handleChange}
                handleFileChange={handleFileChange}
                handleProfileSubmit={handleProfileSubmit}
              />
            ) : (
              <SettingsPanel
                theme={theme}
                passwordData={passwordData}
                handleThemeChange={handleThemeChange}
                handlePasswordChange={handlePasswordChange}
                handlePasswordSubmit={handlePasswordSubmit}
                onLogout={handleLocalLogout}
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// --- Helper Tab Button ---
const TabButton = ({ label, icon: Icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-4 py-2 font-semibold rounded-lg transition-all",
      isActive
        ? "bg-brand text-white shadow-md"
        : "text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
    )}
  >
    <Icon size={18} /> {label}
  </button>
);

// --- Helper: Profile Form Fields ---
const ProfileForm = ({
  formData,
  imagePreview,
  currentUser,
  fileInputRef,
  handleChange,
  handleFileChange,
  handleProfileSubmit,
}) => (
  <motion.form
    key="profile"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    onSubmit={handleProfileSubmit}
    className="space-y-6"
  >
    <div className="flex items-center gap-4">
      <img
        src={
          imagePreview ||
          getAvatarUrl(currentUser.profileImage, currentUser.name)
        }
        alt="Avatar"
        className="w-20 h-20 rounded-full object-cover border-2 border-brand"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = DEFAULT_AVATAR;
        }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current.click()}
        className="flex items-center px-4 py-2 text-sm font-semibold text-brand-hover bg-brand/10 rounded-lg hover:bg-brand/20 transition-colors"
      >
        <Upload size={16} className="mr-2" /> Change Photo
      </button>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
    </div>

    <InputField
      label="Full Name"
      name="name"
      value={formData.name}
      onChange={handleChange}
      required
    />

    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        Bio
      </label>
      <textarea
        name="bio"
        value={formData.bio}
        onChange={handleChange}
        rows="3"
        className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand dark:bg-slate-700 dark:text-slate-200"
        placeholder="Write a little about yourself..."
      />
    </div>

    <InputField
      label="Instagram URL"
      name="instagram"
      value={formData.instagram}
      onChange={handleChange}
      placeholder="https://instagram.com/..."
    />

    <InputField
      label="Facebook URL"
      name="facebook"
      value={formData.facebook}
      onChange={handleChange}
      placeholder="https://facebook.com/..."
    />

    <InputField
      label="LinkedIn URL"
      name="linkedin"
      value={formData.linkedin}
      onChange={handleChange}
      placeholder="https://linkedin.com/in/..."
    />

    <div className="text-right pt-2">
      <Button type="submit">Save Profile</Button>
    </div>
  </motion.form>
);

// --- Helper: Settings Panel ---
const SettingsPanel = ({
  theme,
  passwordData,
  handleThemeChange,
  handlePasswordChange,
  handlePasswordSubmit,
  onLogout,
}) => (
  <motion.div
    key="settings"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="space-y-8"
  >
    {/* Theme Preference */}
    <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 border dark:border-slate-700">
      <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
        <Palette size={20} /> Appearance
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        Choose how Voyage looks to you. Select a theme.
      </p>
      <div className="flex items-center gap-3">
        <Button
          onClick={() => handleThemeChange("light")}
          className={cn(
            "w-full px-3 py-2 rounded-md border",
            theme === "light"
              ? "bg-brand text-white"
              // ✅ --- THE FINAL FIX ---
              : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600"
          )}
        >
          <Sun size={16} className="mr-1" /> Light
        </Button>
        <Button
          onClick={() => handleThemeChange("dark")}
          className={cn(
            "w-full px-3 py-2 rounded-md border",
            theme === "dark"
              ? "bg-brand text-white"
              // ✅ --- THE FINAL FIX ---
              : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600"
          )}
        >
          <Moon size={16} className="mr-1" /> Dark
        </Button>
      </div>
    </div>

    {/* Change Password */}
    <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 border dark:border-slate-700">
      <h3 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-4 flex items-center gap-2">
        <Lock size={20} /> Security
      </h3>
      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <InputField
          label="Current Password"
          name="currentPassword"
          type="password"
          value={passwordData.currentPassword}
          onChange={handlePasswordChange}
          required
        />
        <InputField
          label="New Password"
          name="newPassword"
          type="password"
          value={passwordData.newPassword}
          onChange={handlePasswordChange}
          required
        />
        <InputField
          label="Confirm New Password"
          name="confirmPassword"
          type="password"
          value={passwordData.confirmPassword}
          onChange={handlePasswordChange}
          required
        />
        <div className="text-right">
          <Button type="submit">Update Password</Button>
        </div>
      </form>
    </div>

    {/* Danger Zone */}
    <div className="bg-red-50 dark:bg-red-900/30 p-6 rounded-xl border border-red-200 dark:border-red-700">
      <h3 className="text-xl font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
        <AlertTriangle size={22} /> Danger Zone
      </h3>
      <p className="text-red-600 dark:text-red-300/80 mt-2 mb-4">
        Logging out will end your current session.
      </p>
      <Button
        onClick={onLogout}
        className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/30"
      >
        <LogOut size={16} /> Log Out
      </Button>
    </div>
  </motion.div>
);

export default ProfileEditModal;