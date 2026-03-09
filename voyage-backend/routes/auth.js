// ✅ voyage-backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const Client = require("../models/Client");
const AdminUser = require("../models/AdminUser");
const generalAuth = require("../middleware/generalAuth");

dotenv.config();
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

/* ===================================================
🛡️ Rate Limiting Setup
=================================================== */
const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per windowMs
  message: {
    success: false,
    message: "Too many login attempts from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/* ===================================================
🧾 USER REGISTRATION (POST /api/auth/register)
✅ DELETED
This route conflicted with the OTP flow in /routes/users.js
The frontend is designed for the OTP flow, so this one is removed.
=================================================== */

/* ===================================================
🔐 USER LOGIN (POST /api/auth/login)
=================================================== */
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({
        success: false,
        message: "Email and password required.",
      });

    // ✅ Find verified user (no OTP pending)
    const user = await Client.findOne({ email, otp: { $exists: false } });
    if (!user)
      return res.status(400).json({
        success: false,
        message: "Invalid email or password, or account not verified.",
      });

    if (user.isBlocked)
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked.",
      });

    // ✅ Use model method for password comparison
    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(400).json({
        success: false,
        message: "Invalid email or password.",
      });

    const token = jwt.sign({ id: user._id, role: "client" }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      success: true,
      message: "Login successful.",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: "client",
        },
      },
    });
  } catch (err) {
    console.error("❌ Login Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Server error during login.",
    });
  }
});

/* ===================================================
👑 ADMIN LOGIN (POST /api/auth/admin-login)
=================================================== */
router.post("/admin-login", loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log("🟢 Admin login attempt:", username);

    if (!username || !password)
      return res.status(400).json({
        success: false,
        message: "Username and password required.",
      });

    const admin = await AdminUser.findOne({ username });
    if (!admin)
      return res.status(400).json({
        success: false,
        message: "Invalid username or password (admin not found).",
      });

    // ✅ Compare hashed passwords
    const isMatch = await bcrypt.compare(password, admin.password);
    console.log("🟠 Password match result:", isMatch);

    if (!isMatch)
      return res.status(400).json({
        success: false,
        message: "Invalid username or password (wrong password).",
      });

    const token = jwt.sign({ id: admin._id, role: "admin" }, JWT_SECRET, {
      expiresIn: "7d",
    });

    console.log("✅ Admin login successful for:", username);

    return res.json({
      success: true,
      message: "Admin login successful.",
      data: {
        token,
        user: {
          id: admin._id,
          username: admin.username,
          role: "admin",
        },
      },
    });
  } catch (err) {
    console.error("❌ Admin Login Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Server error during admin login.",
    });
  }
});

/* ===================================================
🔄 TOKEN VALIDATION (GET /api/auth/validate)
=================================================== */
router.get("/validate", generalAuth, async (req, res) => {
  try {
    const { id, role } = req.user;

    // ✅ Admin token validation
    if (role === "admin") {
      const admin = await AdminUser.findById(id).select("-password");
      if (!admin)
        return res.status(404).json({
          success: false,
          message: "Admin not found.",
        });

      return res.json({
        success: true,
        data: {
          id: admin._id,
          username: admin.username,
          role: "admin",
        },
      });
    }

    // ✅ Client token validation
    const user = await Client.findById(id).select("-password");
    if (!user)
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });

    if (user.isBlocked)
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked.",
      });

    return res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: "client",
        bio: user.bio,
        profileImage: user.profileImage,
        isBlocked: user.isBlocked,
      },
    });
  } catch (err) {
    console.error("❌ Validate Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to validate token.",
    });
  }
});

module.exports = router;
