// voyage-backend/routes/profile.js

const express = require("express");
const auth = require("../middleware/auth");
const { checkBlocked } = require("../middleware/checkBlocked");
const Client = require("../models/Client");
const Package = require("../models/Package");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// ... (Multer Storage Setup remains the same)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "..", "uploads");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `profile-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
}).single("profileImageFile");


// ... (GET /api/profile remains the same)
router.get("/", auth, checkBlocked, async (req, res) => {
  try {
    const user = await Client.findById(req.user.id).select("-password -otp -otpExpires");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error("❌ Fetch Profile Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch profile." });
  }
});

// ... (POST /api/profile/update remains the same)
router.post("/update", auth, checkBlocked, upload, async (req, res) => {
  try {
    const { name, bio, socialLinks } = req.body;
    const user = await Client.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    user.name = name || user.name;
    user.bio = bio || user.bio;
    if (socialLinks) {
      user.socialLinks.instagram = socialLinks.instagram || "";
      user.socialLinks.facebook = socialLinks.facebook || "";
      user.socialLinks.linkedin = socialLinks.linkedin || "";
    }
    if (req.file) {
      if (user.profileImage && user.profileImage !== "uploads/default-avatar.png") {
        const oldPath = path.join(__dirname, "..", user.profileImage);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      user.profileImage = `uploads/${req.file.filename}`;
    }
    const updatedUser = await user.save();
    const userResponse = updatedUser.toObject();
    delete userResponse.password;
    res.status(200).json(userResponse);
  } catch (err) {
    console.error("❌ Profile Update Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to update profile." });
  }
});


// ... (POST /api/profile/change-password remains the same)
router.post("/change-password", auth, checkBlocked, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, msg: "New passwords do not match." });
    }
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ success: false, msg: "Password must be at least 6 characters." });
    }
    const user = await Client.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found." });
    }
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, msg: "Incorrect current password." });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, msg: "Password changed successfully." });
  } catch (err) {
    console.error("❌ Change Password Error:", err.message);
    res.status(500).json({ success: false, msg: "Server error changing password." });
  }
});


// ... (POST /api/profile/save/:packageId remains the same)
router.post("/save/:packageId", auth, checkBlocked, async (req, res) => {
  try {
    const { packageId } = req.params;
    const user = await Client.findById(req.user.id);
    const pkg = await Package.findById(packageId);
    if (!pkg) {
      return res.status(404).json({ success: false, message: "Package not found." });
    }
    if (!user.savedPackages.includes(packageId)) {
      user.savedPackages.push(packageId);
      await user.save();
    }
    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(200).json(userResponse);
  } catch (err) {
    console.error("❌ Save Package Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to save package." });
  }
});

// ... (DELETE /api/profile/unsave/:packageId remains the same)
router.delete("/unsave/:packageId", auth, checkBlocked, async (req, res) => {
  try {
    const { packageId } = req.params;
    const user = await Client.findById(req.user.id);
    user.savedPackages.pull(packageId);
    await user.save();
    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(200).json(userResponse);
  } catch (err) {
    console.error("❌ Unsave Package Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to unsave package." });
  }
});

// ... (GET /api/profile/saved remains the same)
router.get("/saved", auth, checkBlocked, async (req, res) => {
  try {
    const user = await Client.findById(req.user.id).populate("savedPackages");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    const activeSavedPackages = user.savedPackages.filter(pkg => pkg && pkg.isActive);
    res.status(200).json(activeSavedPackages);
  } catch (err) {
    console.error("❌ Get Saved Packages Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch saved packages." });
  }
});


// ✅ --- START: NEW "LIKED" PACKAGE ROUTES ---

/* ======================================================
❤️ LIKE PACKAGE
POST /api/profile/like/:packageId
====================================================== */
router.post("/like/:packageId", auth, checkBlocked, async (req, res) => {
  try {
    const { packageId } = req.params;
    const user = await Client.findById(req.user.id);
    const pkg = await Package.findById(packageId);

    if (!pkg) {
      return res.status(404).json({ success: false, message: "Package not found." });
    }

    if (!user.likedPackages.includes(packageId)) {
      user.likedPackages.push(packageId);
      await user.save();
    }

    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(200).json(userResponse);
  } catch (err) {
    console.error("❌ Like Package Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to like package." });
  }
});

/* ======================================================
💔 UNLIKE PACKAGE
DELETE /api/profile/unlike/:packageId
====================================================== */
router.delete("/unlike/:packageId", auth, checkBlocked, async (req, res) => {
  try {
    const { packageId } = req.params;
    const user = await Client.findById(req.user.id);

    user.likedPackages.pull(packageId);
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(200).json(userResponse);
  } catch (err) {
    console.error("❌ Unlike Package Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to unlike package." });
  }
});

/* ======================================================
📚 GET ALL LIKED PACKAGES
GET /api/profile/liked
====================================================== */
router.get("/liked", auth, checkBlocked, async (req, res) => {
  try {
    const user = await Client.findById(req.user.id).populate("likedPackages");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const activeLikedPackages = user.likedPackages.filter(pkg => pkg && pkg.isActive);
    res.status(200).json(activeLikedPackages);
  } catch (err) {
    console.error("❌ Get Liked Packages Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch liked packages." });
  }
});
// ✅ --- END: NEW "LIKED" PACKAGE ROUTES ---

/* ======================================================
✨ GET AI RECOMMENDATIONS
GET /api/profile/recommendations
====================================================== */
router.get("/recommendations", auth, checkBlocked, async (req, res) => {
  try {
    const user = await Client.findById(req.user.id).populate("likedPackages savedPackages");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // 1. Collect Categories from Liked & Saved
    const interestCategories = new Set();

    user.likedPackages.forEach(pkg => {
      if (pkg && pkg.category) interestCategories.add(pkg.category);
    });
    user.savedPackages.forEach(pkg => {
      if (pkg && pkg.category) interestCategories.add(pkg.category);
    });

    // Default to 'Adventure' if no interests yet
    if (interestCategories.size === 0) {
      interestCategories.add("Adventure");
    }

    const categoriesArray = Array.from(interestCategories);

    // 2. Find similar packages
    // Exclude ones already liked/saved
    const excludeIds = [
      ...user.likedPackages.map(p => p._id),
      ...user.savedPackages.map(p => p._id)
    ];

    const recommended = await Package.find({
      category: { $in: categoriesArray },
      _id: { $nin: excludeIds },
      isActive: true
    }).limit(5); // Top 5

    res.status(200).json(recommended);
  } catch (err) {
    console.error("❌ Recommendations Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch recommendations." });
  }
});

module.exports = router;