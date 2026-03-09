// voyage-backend/routes/testimonials.js

const express = require("express");
const router = express.Router();
const Testimonial = require("../models/Testimonial");

/* ======================================================
💬 GET ALL TESTIMONIALS
GET /api/testimonials
====================================================== */
router.get("/", async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (err) {
    console.error("❌ Fetch Testimonials Error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch testimonials." });
  }
});

/* ======================================================
✍️ ADD NEW TESTIMONIAL
POST /api/testimonials/add
====================================================== */
router.post("/add", async (req, res) => {
  try {
    // ✅ Modified: Added email & rating support
    const { name, email, feedback, rating } = req.body;

    if (!name || !feedback) {
      return res
        .status(400)
        .json({ success: false, message: "Name and feedback are required." });
    }

    // ✅ Modified: Added rating and email fields
    const newTestimonial = new Testimonial({ name, email, feedback, rating });
    const savedTestimonial = await newTestimonial.save();

    res.status(201).json({
      success: true,
      message: "Testimonial added successfully.",
      data: savedTestimonial,
    });
  } catch (err) {
    console.error("❌ Add Testimonial Error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to add testimonial." });
  }
});

module.exports = router;
