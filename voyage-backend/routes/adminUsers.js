// voyage-backend/routes/adminUsers.js
const express = require("express");
const Client = require("../models/Client");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

/* ======================================================
👥 GET ALL USERS
GET /api/admin-users
====================================================== */
// --- FIX 1: Changed "/users" to "/" ---
router.get("/", adminAuth, async (req, res) => {
  try {
    const users = await Client.find()
      .sort({ createdAt: -1 })
      .select("-password");

    res.json({ success: true, data: users });
  } catch (err) {
    console.error("❌ Error fetching users:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users.",
    });
  }
});

/* ======================================================
🚫 BLOCK USER
PATCH /api/admin-users/:id/block
====================================================== */
// --- FIX 2: Changed "/users/:id/block" to "/:id/block" ---
router.patch("/:id/block", adminAuth, async (req, res) => {
  try {
    const user = await Client.findByIdAndUpdate(
      req.params.id,
      { isBlocked: true },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.json({
      success: true,
      message: `${user.name} has been blocked successfully.`,
      data: user,
    });
  } catch (err) {
    console.error("❌ Block user error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to block user.",
    });
  }
});

/* ======================================================
✅ UNBLOCK USER
PATCH /api/admin-users/:id/unblock
====================================================== */
// --- FIX 3: Changed "/users/:id/unblock" to "/:id/unblock" ---
router.patch("/:id/unblock", adminAuth, async (req, res) => {
  try {
    const user = await Client.findByIdAndUpdate(
      req.params.id,
      { isBlocked: false },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.json({
      success: true,
      message: `${user.name} has been unblocked successfully.`,
      data: user,
    });
  } catch (err) {
    console.error("❌ Unblock user error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to unblock user.",
    });
  }
});

/* ======================================================
🧍 SINGLE USER DETAILS
GET /api/admin-users/:id
====================================================== */
// --- FIX 4: Changed "/users/:id" to "/:id" ---
router.get("/:id", adminAuth, async (req, res) => {
  try {
    const user = await Client.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    console.error("❌ Fetch user error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user details.",
    });
  }
});

module.exports = router;
