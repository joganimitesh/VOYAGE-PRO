// voyage-backend/routes/packages.js
const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminAuth"); // ✅ Make sure this is imported
const Package = require("../models/Package");
const Client = require("../models/Client"); // ✅ Added Client model
const { storage } = require("../config/cloudinary"); // ✅ Import Cloudinary Storage
const multer = require("multer");

/* ======================================================
📁 Multer Configuration
====================================================== */
const upload = multer({ storage }).single("image");

/* ======================================================
🌍 GET ALL PACKAGES (Public)
====================================================== */
router.get("/", async (req, res) => {
  try {
    const packages = await Package.find({ isActive: true }).sort({
      createdAt: -1,
    });
    res.json(packages);
  } catch (err) {
    console.error("❌ Fetch Packages Error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch travel packages." });
  }
});

/* ======================================================
🛡️ GET ALL PACKAGES (Admin Only)
====================================================== */
router.get("/all-admin", adminAuth, async (req, res) => {
  try {
    const packages = await Package.find().sort({ createdAt: -1 });
    res.json(packages);
  } catch (err) {
    console.error("❌ Fetch All Admin Packages Error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch all packages." });
  }
});

/* ======================================================
🧭 GET SINGLE PACKAGE (Admin Edit)
Route: GET /api/packages/details-admin/:id
====================================================== */
router.get("/details-admin/:id", adminAuth, async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) {
      return res
        .status(404)
        .json({ success: false, message: "Package not found." });
    }
    res.json(pkg);
  } catch (err) {
    console.error("❌ Fetch Single Admin Package Error:", err.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

/* ======================================================
🌐 GET SINGLE PACKAGE (Public)
Route: GET /api/packages/:id
====================================================== */
router.get("/:id", async (req, res) => {
  try {
    const pkg = await Package.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!pkg) {
      return res
        .status(404)
        .json({ success: false, message: "Package not found or is inactive." });
    }
    res.json(pkg);
  } catch (err) {
    console.error("❌ Fetch Single Package Error:", err.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

/* ======================================================
➕ ADD NEW PACKAGE (Admin Only)
====================================================== */
router.post("/", adminAuth, upload, async (req, res) => {
  try {
    const { name, category, description, price, duration, location } =
      req.body;

    if (!name || !category || !description || !price || !duration) {
      return res
        .status(400)
        .json({ success: false, message: "All required fields are not filled." });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Image upload is required." });
    }

    const imagePath = req.file.path; // ✅ Cloudinary URL instead of local path

    const newPackage = new Package({
      name,
      category,
      description,
      price: Number(price),
      duration,
      image: imagePath,
      location: location || category,
      rating: 0, // ✅ Default to 0, updated via reviews
      highlights: req.body.highlights ? req.body.highlights.split(",") : [],
    });

    const savedPackage = await newPackage.save();
    res.status(201).json(savedPackage);
  } catch (err) {
    console.error("❌ Add Package Error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to add new travel package." });
  }
});

/* ======================================================
✏️ UPDATE PACKAGE (Admin Only)
====================================================== */
router.patch("/:id", adminAuth, upload, async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData.rating; // ✅ Prevent manual rating updates

    if (req.file) {
      updateData.image = req.file.path; // ✅ Cloudinary URL
    }

    if (updateData.highlights && typeof updateData.highlights === "string") {
      updateData.highlights = updateData.highlights.split(",");
    }

    if (req.body.isActive !== undefined) {
      updateData.isActive =
        req.body.isActive === "true" || req.body.isActive === true;
    }

    const updatedPackage = await Package.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedPackage) {
      return res
        .status(404)
        .json({ success: false, message: "Package not found." });
    }

    res.json(updatedPackage);
  } catch (err) {
    console.error("❌ Update Package Error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to update package." });
  }
});

/* ======================================================
🗑️ DELETE PACKAGE (Admin Only)
====================================================== */
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const deleted = await Package.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Package not found." });
    }
    res.json({
      success: true,
      message: "Package deleted successfully.",
    });
  } catch (err) {
    console.error("❌ Delete Package Error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete package." });
  }
});

/* ======================================================
⭐ RATE PACKAGE (User Only)
POST /api/packages/:id/rate
====================================================== */
router.post("/:id/rate", require("../middleware/generalAuth"), async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const packageId = req.params.id;
    const userId = req.user.id;

    console.log(`⭐ Rate Request Received: User ${userId}, Package ${packageId}, Rating ${rating} `);

    if (!rating || rating < 1 || rating > 5) {
      console.log("❌ Invalid Rating Value:", rating);
      return res.status(400).json({ success: false, message: "Invalid rating (1-5)." });
    }

    const pkg = await Package.findById(packageId);
    if (!pkg) {
      console.log("❌ Package Not Found:", packageId);
      return res.status(404).json({ success: false, message: "Package not found." });
    }

    // Check if user already reviewed - REMOVED to allow multiple reviews
    // const alreadyReviewed = pkg.reviews.find(
    //   (r) => r.user.toString() === userId.toString()
    // );
    // if (alreadyReviewed) {
    //   return res.status(400).json({ success: false, message: "You have already reviewed this package." });
    // }

    // ✅ Fetch User Name (since token might not have it)
    const user = await Client.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const review = {
      user: userId,
      userName: user.name, // ✅ Required field
      rating: Number(rating),
      comment,
    };

    pkg.reviews.push(review);

    // Calculate new average rating
    pkg.numReviews = pkg.reviews.length;
    pkg.rating =
      pkg.reviews.reduce((acc, item) => item.rating + acc, 0) /
      pkg.reviews.length;

    await pkg.save();
    console.log("✅ Rating Saved Successfully!");

    res.status(201).json({ success: true, message: "Review added", data: pkg });
  } catch (err) {
    console.error("❌ Rate Package Error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
