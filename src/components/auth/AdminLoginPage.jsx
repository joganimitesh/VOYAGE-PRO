import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import apiClient from "../../api/apiClient";
import Button from "../ui/Button";
import { Shield, User, Lock } from "lucide-react";
import { cn } from "../../utils/helpers";
import authBg from "../../assets/auth-bg.jpg";

const AdminLoginPage = ({ handleLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const wrapperRef = useRef(null);

  // ✅ Keep theme consistent
  useEffect(() => {
    const adminTheme = sessionStorage.getItem("voyage-admin-theme") || "light";
    const html = document.documentElement;
    html.classList.remove("light", "dark");
    html.classList.add(adminTheme);
  }, []);

  // ✅ Handle outside click (fix popup focus bug)
  useEffect(() => {
    const handlePointerDown = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        usernameRef.current?.blur();
        passwordRef.current?.blur();
        setIsUsernameFocused(false);
        setIsPasswordFocused(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  // ✅ Prevent sticky focus when popup selection interrupts blur
  useEffect(() => {
    const handleBlurFix = () => {
      requestAnimationFrame(() => {
        if (
          document.activeElement !== usernameRef.current &&
          document.activeElement !== passwordRef.current
        ) {
          setIsUsernameFocused(false);
          setIsPasswordFocused(false);
        }
      });
    };
    usernameRef.current?.addEventListener("blur", handleBlurFix);
    passwordRef.current?.addEventListener("blur", handleBlurFix);
    return () => {
      usernameRef.current?.removeEventListener("blur", handleBlurFix);
      passwordRef.current?.removeEventListener("blur", handleBlurFix);
    };
  }, []);

  // ✅ Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { data } = await apiClient.post("/auth/admin-login", {
        username,
        password,
      });

      if (data?.data?.token) {
        handleLogin(data.data.token);
      } else {
        setError("Unexpected response from server.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid username or password.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Your Original Animation Variants Restored
  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.1, duration: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-6 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center animate-ken-burns"
          style={{
            backgroundImage: `url(${authBg})`,
          }}
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Glassmorphic Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <Shield size={50} className="text-brand-light mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white">Admin Portal</h1>
          <p className="text-slate-300 mt-2">
            Please enter your credentials to continue.
          </p>
        </div>

        {/* Animated Login Form */}
        <motion.form
          ref={wrapperRef}
          variants={formVariants}
          initial="hidden"
          animate="visible"
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {error && (
            <motion.p
              variants={itemVariants}
              className="bg-red-500/30 border border-red-500/50 text-white text-center p-3 rounded-lg text-sm"
            >
              {error}
            </motion.p>
          )}

          {/* Username */}
          <motion.div variants={itemVariants} className="relative">
            <User
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
              size={20}
            />
            <input
              ref={usernameRef}
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => {
                setIsUsernameFocused(true);
                setIsPasswordFocused(false);
              }}
              onBlur={() => {
                if (!wrapperRef.current.contains(document.activeElement)) {
                  setIsUsernameFocused(false);
                }
              }}
              placeholder="Username"
              required
              autoComplete="username"
              className={cn(
                "w-full pl-12 pr-4 py-3 bg-white/10 text-white placeholder-slate-300 border border-white/20 rounded-lg focus:outline-none transition-all duration-200",
                isUsernameFocused && "ring-2 ring-brand shadow-lg shadow-brand/20"
              )}
            />
          </motion.div>

          {/* Password */}
          <motion.div variants={itemVariants} className="relative">
            <Lock
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
              size={20}
            />
            <input
              ref={passwordRef}
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => {
                setIsPasswordFocused(true);
                setIsUsernameFocused(false);
              }}
              onBlur={() => {
                if (!wrapperRef.current.contains(document.activeElement)) {
                  setIsPasswordFocused(false);
                }
              }}
              placeholder="Password"
              required
              autoComplete="current-password"
              className={cn(
                "w-full pl-12 pr-4 py-3 bg-white/10 text-white placeholder-slate-300 border border-white/20 rounded-lg focus:outline-none transition-all duration-200",
                isPasswordFocused && "ring-2 ring-brand shadow-lg shadow-brand/20"
              )}
            />
          </motion.div>

          {/* Button */}
          <motion.div variants={itemVariants}>
            <Button
              type="submit"
              className="w-full text-lg bg-brand text-white hover:bg-brand-hover shadow-lg shadow-brand/30 py-3"
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Sign In"}
            </Button>
          </motion.div>
        </motion.form>

        {/* Footer */}
        <p className="text-center text-sm text-slate-300 mt-8">
          Not an admin?{" "}
          <Link
            to="/landing"
            className="font-semibold text-brand-light hover:text-brand hover:underline"
          >
            Return to portal selection
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default AdminLoginPage;
