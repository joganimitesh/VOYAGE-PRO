import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../../api/apiClient";
import Button from "../ui/Button";
import { UserPlus, User, Mail, Lock } from "lucide-react";
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
    if (value !== "" && index < 3) inputsRef.current[index + 1].focus();
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

// --- Main Register Page Component ---
const UserRegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // ✅ Refs for wrapper div (input + popup)
  const wrapperRef = useRef(null);

  // ✅ Detect clicks outside input/popup to blur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsNameFocused(false);
        setIsEmailFocused(false);
        setIsPasswordFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const userTheme = sessionStorage.getItem("voyage-user-theme") || "light";
    const html = document.documentElement;
    html.classList.remove("light", "dark");
    html.classList.add(userTheme);
  }, []);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleRegisterSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data } = await apiClient.post("/users/register", formData);
      setSuccess(data.message || "OTP sent successfully!");
      setStep(2);
      setResendTimer(30);
    } catch (err) {
      const message =
        err.code === "ERR_NETWORK"
          ? "Network error. Please check your connection."
          : err.response?.data?.message || "Registration failed.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const finalOtp = otp.join("");
      if (finalOtp.length !== 4) {
        setError("Please enter all 4 digits.");
        setIsLoading(false);
        return;
      }

      const { data } = await apiClient.post("/users/verify-otp", {
        email: formData.email,
        otp: finalOtp,
      });

      setSuccess(data.message || "Verification successful! Redirecting...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      const message =
        err.code === "ERR_NETWORK"
          ? "Network error. Please check your connection."
          : err.response?.data?.message || "OTP verification failed.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8"
      >
        {step === 1 ? (
          <>
            <div className="text-center mb-10">
              <UserPlus size={50} className="text-brand-light mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-white">Create Account</h1>
              <p className="text-slate-300 mt-2">
                Start your adventure with us today.
              </p>
            </div>

            <motion.form
              ref={wrapperRef}
              variants={formVariants}
              initial="hidden"
              animate="visible"
              onSubmit={handleRegisterSubmit}
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
              {success && (
                <motion.p
                  variants={itemVariants}
                  className="bg-green-500/30 border border-green-500/50 text-white text-center p-3 rounded-lg text-sm"
                >
                  {success}
                </motion.p>
              )}

              {/* Full Name */}
              <motion.div variants={itemVariants} className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full Name"
                  required
                  onFocus={() => {
                    setIsNameFocused(true);
                    setIsEmailFocused(false);
                    setIsPasswordFocused(false);
                  }}
                  onBlur={() => setIsNameFocused(false)}
                  className={cn(
                    "w-full pl-12 pr-4 py-3 bg-white/10 text-white placeholder-slate-300 border border-white/20 rounded-lg focus:outline-none",
                    isNameFocused && "ring-2 ring-brand-light"
                  )}
                />
              </motion.div>

              {/* Email */}
              <motion.div variants={itemVariants} className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email Address"
                  required
                  onFocus={() => {
                    setIsNameFocused(false);
                    setIsEmailFocused(true);
                    setIsPasswordFocused(false);
                  }}
                  onBlur={() => setIsEmailFocused(false)}
                  className={cn(
                    "w-full pl-12 pr-4 py-3 bg-white/10 text-white placeholder-slate-300 border border-white/20 rounded-lg focus:outline-none",
                    isEmailFocused && "ring-2 ring-brand-light"
                  )}
                />
              </motion.div>

              {/* Password */}
              <motion.div variants={itemVariants} className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Password"
                  required
                  onFocus={() => {
                    setIsNameFocused(false);
                    setIsEmailFocused(false);
                    setIsPasswordFocused(true);
                  }}
                  onBlur={() => setIsPasswordFocused(false)}
                  className={cn(
                    "w-full pl-12 pr-4 py-3 bg-white/10 text-white placeholder-slate-300 border border-white/20 rounded-lg focus:outline-none",
                    isPasswordFocused && "ring-2 ring-brand-light"
                  )}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <Button
                  type="submit"
                  className="w-full text-lg bg-brand text-white hover:bg-brand-hover shadow-lg shadow-brand/30 py-3"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending OTP..." : "Register"}
                </Button>
              </motion.div>
            </motion.form>
          </>
        ) : (
          <>
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold text-white">Verify Your Email</h1>
              <p className="text-slate-300 mt-2">
                Enter the 4-digit code sent to {formData.email}
              </p>
            </div>

            <motion.form
              variants={formVariants}
              initial="hidden"
              animate="visible"
              onSubmit={handleOtpSubmit}
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
              {success && (
                <motion.p
                  variants={itemVariants}
                  className="bg-green-500/30 border border-green-500/50 text-white text-center p-3 rounded-lg text-sm"
                >
                  {success}
                </motion.p>
              )}

              <OtpInput otp={otp} setOtp={setOtp} />

              <motion.div variants={itemVariants}>
                <Button
                  type="submit"
                  className="w-full text-lg bg-brand text-white hover:bg-brand-hover shadow-lg shadow-brand/30 py-3"
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </Button>
              </motion.div>

              <p className="text-center text-slate-300 text-sm mt-4">
                Didn’t receive the code?{" "}
                <button
                  type="button"
                  onClick={handleRegisterSubmit}
                  disabled={resendTimer > 0}
                  className="text-brand-light hover:text-brand font-semibold"
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                </button>
              </p>
            </motion.form>
          </>
        )}

        {step === 1 && (
          <p className="text-center text-sm text-slate-300 mt-8">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-brand-light hover:text-brand hover:underline"
            >
              Sign in here
            </Link>
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default UserRegisterPage;
