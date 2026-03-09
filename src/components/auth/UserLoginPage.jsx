import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../../api/apiClient";
import Button from "../ui/Button";
import { User, Mail, Lock, Key, RotateCcw, CheckSquare } from "lucide-react";
import { cn } from "../../utils/helpers";
import authBg from "../../assets/auth-bg.jpg";

// --- OTP Input Component ---
const OtpInput = ({ otp, setOtp }) => {
  const inputsRef = useRef([]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (!/^[0-9]$/.test(value) && value !== "") return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value !== "" && index < 3) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  return (
    <div className="flex justify-center gap-3">
      {Array(4)
        .fill("")
        .map((_, index) => (
          <input
            key={index}
            ref={(el) => (inputsRef.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength="1"
            value={otp[index]}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className="w-14 h-14 text-center text-2xl font-semibold bg-white/20 text-white border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-light"
          />
        ))}
    </div>
  );
};


// --- Main Login Page Component ---
const UserLoginPage = ({ handleUserLogin }) => {
  const [view, setView] = useState("login"); // 'login', 'forgot', 'verify_otp', 'reset_password'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // --- Focus State Management ---
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isNewPasswordFocused, setIsNewPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const newPasswordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  useEffect(() => {
    const userTheme = sessionStorage.getItem("voyage-user-theme") || "light";
    const html = document.documentElement;
    html.classList.remove("light", "dark");
    html.classList.add(userTheme);
  }, []);

  // Autofill focus handler
  useEffect(() => {
    const handleAnimationStart = (e) => {
      if (e.animationName === "onAutoFillStart") {
        const target = e.target;
        setIsEmailFocused(target === emailRef.current);
        setIsPasswordFocused(target === passwordRef.current);
        setIsNewPasswordFocused(target === newPasswordRef.current);
        setIsConfirmPasswordFocused(target === confirmPasswordRef.current);
      }
    };

    const refs = [emailRef, passwordRef, newPasswordRef, confirmPasswordRef];
    const elements = refs.map(ref => ref.current).filter(Boolean);

    elements.forEach(el => el.addEventListener("animationstart", handleAnimationStart));
    return () => {
      elements.forEach(el => el.removeEventListener("animationstart", handleAnimationStart));
    };
  }, [view]); // Re-run when view changes

  // Clear errors when view changes
  useEffect(() => {
    setError("");
    setSuccess("");
  }, [view]);

  // --- Form Submit Handlers ---

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data } = await apiClient.post("/auth/login", { email, password });
      if (data?.data?.token) {
        handleUserLogin(data.data.token);
      } else {
        setError("Login failed: No token received.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data } = await apiClient.post("/users/forgot-password", { email });
      setSuccess(data.message);
      setView("verify_otp");
    } catch (err) {
      setError(err.response?.data?.message || "Could not send reset code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerifySubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    const finalOtp = otp.join("");
    if (finalOtp.length !== 4) {
      setError("OTP must be 4 digits.");
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await apiClient.post("/users/verify-reset-otp", {
        email,
        otp: finalOtp,
      });
      setSuccess(data.message);
      setView("reset_password");
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      setIsLoading(false);
      return;
    }

    const finalOtp = otp.join("");
    if (finalOtp.length !== 4) {
      setError("An error occurred. Please try the 'Forgot Password' process again.");
      setIsLoading(false);
      setView("login");
      return;
    }

    try {
      const { data } = await apiClient.post("/users/reset-password", {
        email,
        otp: finalOtp,
        newPassword,
      });
      setSuccess(data.message + " You can now log in.");
      setView("login");
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOtp(["", "", "", ""]);
    } catch (err) {
      setError(err.response?.data?.message || "Password reset failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Animation Variants ---
  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <div className="min-h-screen w-full overflow-hidden relative flex items-center justify-center p-6">
      {/* Background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center animate-ken-burns"
          style={{
            backgroundImage: `url(${authBg})`,
          }}
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Glassmorphic Card */}
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8"
      >
        <AnimatePresence mode="wait">

          {/* --- VIEW 1: LOGIN --- */}
          {view === "login" && (
            <motion.div
              key="login"
              variants={formVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="text-center mb-10">
                <User size={50} className="text-brand-light mx-auto mb-4" />
                <h1 className="text-4xl font-bold text-white">Welcome Back!</h1>
                <p className="text-slate-300 mt-2">
                  Sign in to continue your journey.
                </p>
              </div>

              {error && (
                <p className="bg-red-500/30 border border-red-500/50 text-white text-center p-3 rounded-lg text-sm mb-6">
                  {error}
                </p>
              )}
              {success && (
                <p className="bg-green-500/30 border border-green-500/50 text-white text-center p-3 rounded-lg text-sm mb-6">
                  {success}
                </p>
              )}

              <motion.form
                onSubmit={handleLoginSubmit}
                className="space-y-6"
              >
                <motion.div variants={itemVariants} className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                    size={20}
                  />
                  <input
                    ref={emailRef}
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    required
                    onFocus={() => { setIsEmailFocused(true); setIsPasswordFocused(false); }}
                    onBlur={() => setIsEmailFocused(false)}
                    className={cn(
                      "w-full pl-12 pr-4 py-3 bg-white/10 text-white placeholder-slate-300 border border-white/20 rounded-lg focus:outline-none",
                      isEmailFocused && "ring-2 ring-brand-light"
                    )}
                  />
                </motion.div>

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
                    placeholder="Password"
                    required
                    onFocus={() => { setIsEmailFocused(false); setIsPasswordFocused(true); }}
                    onBlur={() => setIsPasswordFocused(false)}
                    className={cn(
                      "w-full pl-12 pr-4 py-3 bg-white/10 text-white placeholder-slate-300 border border-white/20 rounded-lg focus:outline-none",
                      isPasswordFocused && "ring-2 ring-brand-light"
                    )}
                  />
                </motion.div>

                <motion.div variants={itemVariants} className="text-right -mt-2">
                  <button
                    type="button"
                    onClick={() => setView("forgot")}
                    className="text-sm font-semibold text-brand-light hover:text-brand hover:underline"
                  >
                    Forgot password?
                  </button>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Button
                    type="submit"
                    className="w-full text-lg bg-brand text-white hover:bg-brand-hover shadow-lg shadow-brand/30 py-3"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </motion.div>
              </motion.form>

              <p className="text-center text-sm text-slate-300 mt-8">
                Don’t have an account?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-brand-light hover:text-brand hover:underline"
                >
                  Register here
                </Link>
              </p>
            </motion.div>
          )}

          {/* --- VIEW 2: FORGOT PASSWORD --- */}
          {view === "forgot" && (
            <motion.div
              key="forgot"
              variants={formVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="text-center mb-10">
                <Key size={50} className="text-brand-light mx-auto mb-4" />
                <h1 className="text-4xl font-bold text-white">Reset Password</h1>
                <p className="text-slate-300 mt-2">
                  Enter your email to receive a reset code.
                </p>
              </div>

              {error && (
                <p className="bg-red-500/30 border border-red-500/50 text-white text-center p-3 rounded-lg text-sm mb-6">
                  {error}
                </p>
              )}

              <motion.form
                onSubmit={handleForgotSubmit}
                className="space-y-6"
              >
                <motion.div variants={itemVariants} className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                    size={20}
                  />
                  <input
                    ref={emailRef}
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    required
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                    className={cn(
                      "w-full pl-12 pr-4 py-3 bg-white/10 text-white placeholder-slate-300 border border-white/20 rounded-lg focus:outline-none",
                      isEmailFocused && "ring-2 ring-brand-light"
                    )}
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Button
                    type="submit"
                    className="w-full text-lg bg-brand text-white hover:bg-brand-hover shadow-lg shadow-brand/30 py-3"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending Code..." : "Send Reset Code"}
                  </Button>
                </motion.div>
              </motion.form>

              <p className="text-center text-sm text-slate-300 mt-8">
                Remembered your password?{" "}
                <button
                  onClick={() => setView("login")}
                  className="font-semibold text-brand-light hover:text-brand hover:underline"
                >
                  Back to Login
                </button>
              </p>
            </motion.div>
          )}

          {/* --- VIEW 3: VERIFY OTP --- */}
          {view === "verify_otp" && (
            <motion.div
              key="verify_otp"
              variants={formVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="text-center mb-10">
                <CheckSquare size={50} className="text-brand-light mx-auto mb-4" />
                <h1 className="text-4xl font-bold text-white">Verify Code</h1>
                <p className="text-slate-300 mt-2">
                  A 4-digit code was sent to {email}.
                </p>
              </div>

              {error && (
                <p className="bg-red-500/30 border border-red-500/50 text-white text-center p-3 rounded-lg text-sm mb-6">
                  {error}
                </p>
              )}
              {success && (
                <p className="bg-green-500/30 border border-green-500/50 text-white text-center p-3 rounded-lg text-sm mb-6">
                  {success}
                </p>
              )}

              <motion.form
                onSubmit={handleOtpVerifySubmit}
                className="space-y-6"
              >
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium text-slate-300 mb-2 text-center">Enter 4-Digit OTP</label>
                  <OtpInput otp={otp} setOtp={setOtp} />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Button
                    type="submit"
                    className="w-full text-lg bg-brand text-white hover:bg-brand-hover shadow-lg shadow-brand/30 py-3"
                    disabled={isLoading}
                  >
                    {isLoading ? "Verifying..." : "Verify OTP"}
                  </Button>
                </motion.div>
              </motion.form>

              <p className="text-center text-sm text-slate-300 mt-8">
                Didn't get a code?{" "}
                <button
                  onClick={handleForgotSubmit}
                  disabled={isLoading}
                  className="font-semibold text-brand-light hover:text-brand hover:underline"
                >
                  Resend
                </button>
              </p>
            </motion.div>
          )}

          {/* --- VIEW 4: RESET PASSWORD --- */}
          {view === "reset_password" && (
            <motion.div
              key="reset_password"
              variants={formVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="text-center mb-10">
                <RotateCcw size={50} className="text-brand-light mx-auto mb-4" />
                <h1 className="text-4xl font-bold text-white">Enter New Password</h1>
                <p className="text-slate-300 mt-2">
                  Your OTP is verified. Please set a new password.
                </p>
              </div>

              {error && (
                <p className="bg-red-500/30 border border-red-500/50 text-white text-center p-3 rounded-lg text-sm mb-6">
                  {error}
                </p>
              )}
              {success && (
                <p className="bg-green-500/30 border border-green-500/50 text-white text-center p-3 rounded-lg text-sm mb-6">
                  {success}
                </p>
              )}

              <motion.form
                onSubmit={handleResetSubmit}
                className="space-y-6"
              >
                <motion.div variants={itemVariants} className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                    size={20}
                  />
                  <input
                    ref={newPasswordRef}
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password"
                    required
                    onFocus={() => { setIsNewPasswordFocused(true); setIsConfirmPasswordFocused(false); }}
                    onBlur={() => setIsNewPasswordFocused(false)}
                    className={cn(
                      "w-full pl-12 pr-4 py-3 bg-white/10 text-white placeholder-slate-300 border border-white/20 rounded-lg focus:outline-none",
                      isNewPasswordFocused && "ring-2 ring-brand-light"
                    )}
                  />
                </motion.div>

                <motion.div variants={itemVariants} className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                    size={20}
                  />
                  <input
                    ref={confirmPasswordRef}
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    required
                    onFocus={() => { setIsNewPasswordFocused(false); setIsConfirmPasswordFocused(true); }}
                    onBlur={() => setIsConfirmPasswordFocused(false)}
                    className={cn(
                      "w-full pl-12 pr-4 py-3 bg-white/10 text-white placeholder-slate-300 border border-white/20 rounded-lg focus:outline-none",
                      isConfirmPasswordFocused && "ring-2 ring-brand-light"
                    )}
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Button
                    type="submit"
                    className="w-full text-lg bg-brand text-white hover:bg-brand-hover shadow-lg shadow-brand/30 py-3"
                    disabled={isLoading}
                  >
                    {isLoading ? "Resetting..." : "Reset Password"}
                  </Button>
                </motion.div>
              </motion.form>

              <p className="text-center text-sm text-slate-300 mt-8">
                Changed your mind?{" "}
                <button
                  onClick={() => setView("login")}
                  className="font-semibold text-brand-light hover:text-brand hover:underline"
                >
                  Back to Login
                </button>
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default UserLoginPage;