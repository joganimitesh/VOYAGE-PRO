const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const Client = require("../models/Client");
const { sendOtpEmail, sendPasswordResetOtpEmail } = require("../utils/mailer");

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "defaultSecretKey";

/* ======================================================
🔢 Helper: Generate 4-digit OTP
====================================================== */
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

/* ======================================================
📝 REGISTER USER & SEND OTP (Unchanged)
POST /api/users/register
====================================================== */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    let client = await Client.findOne({ email });

    // Case 1: User exists but is unverified — resend OTP
    if (client && client.otp) {
      const newOtp = generateOTP();
      client.otp = newOtp;
      client.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await client.save();

      await sendOtpEmail(email, newOtp); // Use registration email

      return res.status(200).json({
        success: true,
        message: "Account not verified. A new OTP has been sent.",
        email,
      });
    }

    // Case 2: User already verified
    if (client) {
      return res.status(400).json({
        success: false,
        message: "Email already registered.",
      });
    }

    // Case 3: New registration
    const otp = generateOTP();

    const newClient = await Client.create({
      name,
      email,
      password, // will be hashed via model pre-save hook
      otp,
      otpExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    await sendOtpEmail(email, otp); // Use registration email

    res.status(201).json({
      success: true,
      message: "OTP sent to your email. Please verify to complete registration.",
      email,
    });
  } catch (err) {
    console.error("❌ Register Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error during registration.",
    });
  }
});

/* ======================================================
✅ VERIFY OTP (for Registration) (Unchanged)
POST /api/users/verify-otp
====================================================== */
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    const client = await Client.findOne({ email });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (
      client.otp !== otp ||
      !client.otpExpires ||
      client.otpExpires.getTime() < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP.",
      });
    }

    // Mark verified
    client.otp = undefined;
    client.otpExpires = undefined;
    await client.save();

    res.json({
      success: true,
      message: "Email verified successfully. You can now log in.",
    });
  } catch (err) {
    console.error("❌ Verify OTP Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error during OTP verification.",
    });
  }
});


/* ======================================================
🔑 FORGOT PASSWORD (Send OTP) (Unchanged)
POST /api/users/forgot-password
====================================================== */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const client = await Client.findOne({ email });
    // Find user *only if they are verified* (otp field does not exist)
    if (!client || client.otp) {
      return res.status(404).json({ success: false, message: "No verified account found with that email." });
    }

    const otp = generateOTP();
    client.otp = otp;
    client.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await client.save();

    await sendPasswordResetOtpEmail(client.email, otp); // Use new reset email

    res.json({ success: true, message: "Password reset code sent to your email." });

  } catch (err) {
    console.error("❌ Forgot Password Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while sending reset code.",
    });
  }
});


/* ======================================================
🔐 VERIFY RESET OTP (NEW)
POST /api/users/verify-reset-otp
====================================================== */
router.post("/verify-reset-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required." });
    }

    const client = await Client.findOne({ email });
    if (!client) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Check OTP validity
    if (
      client.otp !== otp ||
      !client.otpExpires ||
      client.otpExpires.getTime() < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP.",
      });
    }

    // Do NOT clear OTP here. Just confirm it's valid.
    res.json({ success: true, message: "OTP Verified." });

  } catch (err) {
    console.error("❌ Verify Reset OTP Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error during OTP verification.",
    });
  }
});


/* ======================================================
🔄 RESET PASSWORD (MODIFIED)
POST /api/users/reset-password
====================================================== */
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }

    const client = await Client.findOne({ email });

    if (!client) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Validation 1: Re-check OTP
    if (
      client.otp !== otp ||
      !client.otpExpires ||
      client.otpExpires.getTime() < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP. Please request a new one.",
      });
    }

    // Validation 2: Check if new password is the same as the old password
    const isMatch = await client.matchPassword(newPassword);
    if (isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: "New password cannot be the same as your old password." 
      });
    }

    // Success! Update password and clear OTP
    client.password = newPassword; // Password will be hashed by pre-save hook
    client.otp = undefined;
    client.otpExpires = undefined;
    await client.save();

    res.json({ success: true, message: "Password has been reset successfully." });

  } catch (err) {
    console.error("❌ Reset Password Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while resetting password.",
    });
  }
});


module.exports = router;