// voyage-backend/routes/team.js

const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminAuth");
const TeamMember = require("../models/TeamMember");
const { storage } = require("../config/cloudinary");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* ======================================================
⚙️ MULTER STORAGE SETUP FOR TEAM IMAGES
====================================================== */
// ✅ FIX: The modal sends the file as 'imageFile'
const upload = multer({ storage }).single("imageFile");

/* ======================================================
👥 GET ALL TEAM MEMBERS
GET /api/team
====================================================== */
router.get("/", async (req, res) => {
  try {
    const teamMembers = await TeamMember.find().sort({ createdAt: 1 });
    res.json({ success: true, data: teamMembers });
  } catch (err) {
    console.error("❌ Fetch Team Error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch team members." });
  }
});

/* ======================================================
➕ ADD A TEAM MEMBER
POST /api/team/add
====================================================== */
router.post("/add", adminAuth, upload, async (req, res) => {
  try {
    const { name, title } = req.body;
    const imagePath = req.file ? req.file.path : "";

    if (!name || !title || !imagePath) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, title, and image.",
      });
    }

    const newTeamMember = new TeamMember({ name, title, image: imagePath });
    const savedMember = await newTeamMember.save();

    res.status(201).json({
      success: true,
      message: "Team member added successfully.",
      data: savedMember,
    });
  } catch (err) {
    console.error("❌ Add Team Error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to add team member." });
  }
});

/* ======================================================
✏️ UPDATE TEAM MEMBER
PATCH /api/team/update/:id
====================================================== */
router.patch("/update/:id", adminAuth, upload, async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) updateData.image = req.file.path;

    const updatedMember = await TeamMember.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedMember) {
      return res
        .status(404)
        .json({ success: false, message: "Team member not found." });
    }

    res.json({
      success: true,
      message: "Team member updated successfully.",
      data: updatedMember,
    });
  } catch (err) {
    console.error("❌ Update Team Error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to update team member." });
  }
});

/* ======================================================
❌ DELETE TEAM MEMBER
DELETE /api/team/:id
====================================================== */
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const member = await TeamMember.findByIdAndDelete(req.params.id);
    if (!member) {
      return res
        .status(404)
        .json({ success: false, message: "Team member not found." });
    }

    // Delete old image if it exists - removed for Cloudinary, manual cleanup needed or Cloudinary API call
    console.log("Team Member Deleted:", member._id);

    res.json({
      success: true,
      message: "Team member deleted successfully.",
    });
  } catch (err) {
    console.error("❌ Delete Team Error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete team member." });
  }
});

module.exports = router;
