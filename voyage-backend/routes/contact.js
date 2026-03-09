// voyage-backend/routes/contact.js
const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminAuth");
const Contact = require("../models/Contact");
const { sendAdminResponseEmail } = require("../utils/mailer");

/* ======================================================
📩 ADD NEW CONTACT MESSAGE
POST /api/contact/add
(Public - no auth required)
====================================================== */
router.post("/add", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill out all fields." });
    }

    const newContact = new Contact({ name, email, subject, message });
    await newContact.save();

    res.status(201).json({
      success: true,
      message: "Your message has been sent successfully!",
      data: newContact,
    });
  } catch (err) {
    console.error("❌ Contact Add Error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Server error while sending message." });
  }
});

/* ======================================================
📬 GET ALL CONTACT MESSAGES (Admin)
GET /api/contact/
(Handled by /api/admin/contact in server.js)
(Protected - Admin only)
====================================================== */
router.get("/", adminAuth, async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json({ success: true, data: messages });
  } catch (err) {
    console.error("❌ Fetch Contact Error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch contact messages." });
  }
});

/* ======================================================
💌 RESPOND TO A CONTACT MESSAGE (Admin)
POST /api/contact/respond/:id
(Handled by /api/admin/contact/respond/:id)
====================================================== */
router.post("/respond/:id", adminAuth, async (req, res) => {
  try {
    const { responseText, userEmail } = req.body;

    if (!responseText?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Response text is required." });
    }

    const message = await Contact.findById(req.params.id);
    if (!message) {
      return res
        .status(404)
        .json({ success: false, message: "Message not found." });
    }

    // --- Send the email ---
    await sendAdminResponseEmail(
      userEmail,
      message.name,
      message.subject,
      responseText
    );

    // --- Update the database ---
    message.status = "Responded";
    message.responseText = responseText;
    message.respondedAt = new Date();
    await message.save();

    res.json({
      success: true,
      message: "Response sent successfully.",
      data: message,
    });
  } catch (err) {
    console.error("❌ Contact Response Error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to send admin response." });
  }
});

/* ======================================================
🗑️ DELETE CONTACT MESSAGE (Admin)
DELETE /api/contact/:id
(Handled by /api/admin/contact/:id)
====================================================== */
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const deletedMessage = await Contact.findByIdAndDelete(req.params.id);

    if (!deletedMessage) {
      return res
        .status(404)
        .json({ success: false, message: "Message not found." });
    }

    res.json({ success: true, message: "Message deleted successfully." });
  } catch (err) {
    console.error("❌ Delete Contact Error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete message." });
  }
});

module.exports = router;
