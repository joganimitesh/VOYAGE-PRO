// src/components/layout/Navbar.jsx

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn, getImageUrl, getAvatarUrl, DEFAULT_AVATAR } from "../../utils/helpers"; // ✅ Added DEFAULT_AVATAR // ✅ Added getImageUrl
import Button from "../ui/Button";
import { UserCircle, ChevronDown, Sun, Moon } from "lucide-react";
import logo from "../../assets/voyage-logo-new.png";

const Navbar = ({
  isUserAuthenticated,
  isAdminAuthenticated,
  currentUser,
  userProfile,
  handleLogout,
  applyTheme,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  );
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  // The hero section is only on the home page '/'
  const isHomePage = currentPath === "/";
  const isOverHero = isHomePage && !isScrolled;

  useEffect(() => {
    // Only add scroll listener if on the homepage
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    if (isHomePage) {
      setIsScrolled(window.scrollY > 10); // Check initial scroll
      window.addEventListener("scroll", handleScroll);
    } else {
      // If not on home page, navbar is always "scrolled"
      setIsScrolled(true);
    }

    return () => {
      if (isHomePage) {
        window.removeEventListener("scroll", handleScroll);
      }
    };
  }, [currentPath, isHomePage]);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Packages", path: "/packages" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  if (isAdminAuthenticated) {
    navLinks.push({ name: "Admin Panel", path: "/admin" });
  }

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    setIsDark(!isDark);
    if (applyTheme) applyTheme(newTheme);
    if (location.pathname.startsWith("/admin")) {
      sessionStorage.setItem("voyage-admin-theme", newTheme);
    } else {
      sessionStorage.setItem("voyage-user-theme", newTheme);
    }
  };

  const displayName = userProfile?.name?.split(" ")[0] || "User";
  const displayImage = userProfile?.profileImage;

  return (
    <motion.header
      initial={{ y: "-100%", opacity: 0 }}
      animate={{ y: "0%", opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
      // ✅ FIX: Added dark mode classes
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-colors duration-300",
        isOverHero
          ? "bg-transparent"
          : "bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-md border-b border-slate-200 dark:border-slate-700"
      )}
    >
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* ✅ FIX: Added dark mode class for scrolled state */}
        <Link
          to="/"
          className={cn(
            "text-3xl font-bold flex items-center gap-2 group",
            isOverHero ? "text-white" : "text-brand dark:text-brand-light"
          )}
        >
          <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center border-2 border-slate-200 dark:border-slate-700 bg-white shadow-sm">
            <img
              src={logo}
              alt="Voyage Logo"
              className="w-full h-full object-cover scale-[2.0] transition-transform duration-300 group-hover:scale-[2.1]"
            />
          </div>
          Voyage Pro
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => {
            const isActive =
              (location.pathname.startsWith(link.path) && link.path !== "/") ||
              location.pathname === link.path;

            return (
              <Link
                key={link.name}
                to={link.path}
                // ✅ FIX: Added dark mode classes for link text
                className={cn(
                  "pb-1 font-medium text-lg relative",
                  isActive
                    ? isOverHero
                      ? "text-white"
                      : "text-brand"
                    : isOverHero
                      ? "text-brand"
                      : "text-slate-700 dark:text-slate-300 hover:text-brand dark:hover:text-brand-light"
                )}
              >
                {link.name}
                {isActive && (
                  <motion.div
                    className={cn(
                      "absolute -bottom-1 left-0 right-0 h-0.5",
                      isOverHero
                        ? "bg-white"
                        : "bg-brand dark:bg-brand-light"
                    )}
                    layoutId="underline"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center space-x-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none",
              isOverHero
                ? "bg-white/15 hover:bg-white/25 text-white"
                : "bg-brand/10 hover:bg-brand/20 text-brand dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-brand-light"
            )}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait">
              {isDark ? (
                <motion.div
                  key="moon"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                  transition={{ duration: 0.25 }}
                >
                  <Moon size={18} />
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  initial={{ scale: 0, rotate: 90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: -90 }}
                  transition={{ duration: 0.25 }}
                >
                  <Sun size={18} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
          {isAdminAuthenticated ? (
            <Button
              variant="primary"
              onClick={() => handleLogout("admin")}
              className="hidden md:flex"
            >
              Logout Admin
            </Button>
          ) : isUserAuthenticated ? (
            <div className="hidden md:flex items-center gap-4 relative">
              {/* ✅ FIX: Added dark mode text class */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={cn(
                  "flex items-center gap-2 cursor-pointer font-semibold",
                  isOverHero
                    ? "text-white"
                    : "text-slate-700 dark:text-slate-200"
                )}
              >
                <img
                  src={displayImage ? getImageUrl(displayImage) : DEFAULT_AVATAR}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover border-2 border-brand/10"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_AVATAR;
                  }}
                />
                <span>Hi, {displayName}!</span>
                <ChevronDown
                  size={18}
                  className={cn(
                    "transition-transform",
                    isDropdownOpen && "rotate-180"
                  )}
                />
              </button>

              {isDropdownOpen && (
                <>
                  {/* Invisible overlay to close dropdown when clicking outside */}
                  <div
                    className="fixed inset-0 z-0"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg border dark:border-slate-700 z-10 py-1"
                  >
                    <Link
                      to="/my-profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/my-bookings"
                      onClick={() => setIsDropdownOpen(false)}
                      className="block px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      My Bookings
                    </Link>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleLogout("user");
                      }}
                      className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50"
                    >
                      Logout
                    </button>
                  </motion.div>
                </>
              )}
            </div>
          ) : (
            <Button
              onClick={() => navigate("/landing")}
              variant={isOverHero ? "secondary" : "primary"}
              className="hidden md:flex"
            >
              Login / Register
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default Navbar;
