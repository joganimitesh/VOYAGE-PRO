// src/components/auth/LandingPage.jsx

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import portalBg from "../../assets/portal-bg.jpg";

const LandingPage = () => {
  const navigate = useNavigate();

  // ✅ Apply saved user theme on mount
  useEffect(() => {
    const userTheme = sessionStorage.getItem("voyage-user-theme") || "light";
    const html = document.documentElement;
    html.classList.remove("light", "dark");
    html.classList.add(userTheme);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, duration: 0.8 },
    },
  };

  return (
    <div className="min-h-screen w-full overflow-hidden relative">
      {/* 🖼 Background Image */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center animate-ken-burns"
          style={{
            backgroundImage: `url(${portalBg})`,
          }}
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* ✨ Foreground Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center justify-center text-center w-full min-h-screen p-8 text-white"
      >
        <motion.h1
          variants={itemVariants}
          className="text-6xl md:text-8xl font-extrabold text-white mb-4 drop-shadow-lg"
        >
          Voyage Pro
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-xl md:text-2xl text-slate-100 font-medium mb-16 max-w-2xl drop-shadow"
        >
          Your next unforgettable journey begins with a single choice.
        </motion.p>

        {/* 🌍 Portal Selection Cards */}
        <div className="flex flex-col md:flex-row gap-12">
          {/* 🧍 User Portal Card */}
          <motion.div
            variants={itemVariants}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="group w-80 h-96 bg-white/10 rounded-2xl shadow-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer border border-white/20 hover:border-brand-light/40 backdrop-blur-md"
            onClick={() => navigate("/register")}
          >
            <User
              size={80}
              className="text-brand-light mb-6 transition-transform duration-300 group-hover:scale-110"
            />
            <h2 className="text-4xl font-bold text-white mb-3">
              User Portal
            </h2>
            <p className="text-slate-200 text-lg">
              Explore, dream, and book your next adventure.
            </p>
          </motion.div>

          {/* 🛡 Admin Portal Card */}
          <motion.div
            variants={itemVariants}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="group w-80 h-96 bg-white/10 rounded-2xl shadow-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer border border-white/20 hover:border-slate-300/50 backdrop-blur-md"
            onClick={() => navigate("/admin/login")}
          >
            <Shield
              size={80}
              className="text-slate-200 mb-6 transition-transform duration-300 group-hover:scale-110"
            />
            <h2 className="text-4xl font-bold text-white mb-3">
              Admin Portal
            </h2>
            <p className="text-slate-200 text-lg">
              Manage the world of travel with powerful tools.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div >
  );
};

export default LandingPage;
