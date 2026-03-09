// voyage-backend/routes/requests.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const { checkBlocked } = require("../middleware/checkBlocked");
const Request = require("../models/Request");
const Client = require("../models/Client");
const Package = require("../models/Package");
const Transaction = require("../models/Transaction");
const { sendBookingConfirmationEmail } = require("../utils/mailer");

// ... (Multer setup remains the same)
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ✅ Helper to log to file
const logToFile = (message) => {
  const logPath = path.join(__dirname, "..", "backend-debug.log");
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
};
const docStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "..", "uploads", "documents");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const safeName = req.user.id || "user";
    cb(null, `doc-${safeName}-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const uploadDoc = multer({
  storage: docStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Increased to 50MB
}).single("document");


/* ======================================================
🔍 CHECK DUPLICATE BOOKING (User)
POST /api/requests/check-duplicate
====================================================== */
/* ======================================================
🔍 CHECK DUPLICATE BOOKING (User)
POST /api/requests/check-duplicate
====================================================== */
router.post("/check-duplicate", auth, checkBlocked, async (req, res) => {
  try {
    const { packageId, date } = req.body;

    // 1. Get Package Duration (Authoritative)
    const pkg = await Package.findById(packageId);
    if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });

    // Parse duration 
    const pkgDuration = parseInt(pkg.duration) || 1;

    // 2. Define New Booking Range (UTC)
    // We treat the "date" string (e.g., "2025-12-30") as UTC Midnight
    const newStart = new Date(date);
    // Force to UTC midnight just to be safe if 'date' came with time
    newStart.setUTCHours(0, 0, 0, 0);

    const newEnd = new Date(newStart);
    newEnd.setUTCDate(newEnd.getUTCDate() + pkgDuration);

    // 3. Find Potential Conflicts
    const existingBookings = await Request.find({
      clientId: req.user.id,
      packageId: packageId,
      status: { $nin: ["Cancelled", "Rejected"] }
    }).sort({ createdAt: -1 }); // ✅ Prioritize most recent booking in case of multiple overlaps

    // 4. Check Intersections (Using UTC)
    for (const booking of existingBookings) {
      // Existing booking date is already stored as UTC ISODate in Mongo
      const existingStart = new Date(booking.date);
      existingStart.setUTCHours(0, 0, 0, 0);

      const existingDuration = booking.duration || pkgDuration;
      const existingEnd = new Date(existingStart);
      existingEnd.setUTCDate(existingEnd.getUTCDate() + existingDuration);

      if (newStart < existingEnd && newEnd > existingStart) {
        console.log("⚠️ Conflict Found - forcing restart");
        // ... logs ...

        return res.json({
          success: true,
          exists: true,
          bookingId: booking._id,
          currentGuests: booking.guests,
          existingStartDate: existingStart.toISOString(), // Send back reliable UTC
          existingEndDate: existingEnd.toISOString(),
          packageName: pkg.name,
          documentPath: booking.documentPath, // ✅ Return document path for reuse
          clientPhone: booking.clientPhone, // ✅ Return phone for auto-fill
          cabBooking: !!booking.cabBooking // ✅ Return cab status to prevent double charge (Explicit Boolean)
        });
      }
    }

    return res.json({ success: true, exists: false });
  } catch (err) {
    console.error("❌ Check Duplicate Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to check duplicates." });
  }
});

/* ======================================================
🧾 BOOK PACKAGE (User)
POST /api/requests/book
====================================================== */
// ... (This route remains the same)
router.post("/book", auth, checkBlocked, uploadDoc, async (req, res) => {
  logToFile("👉 /book Endpoint Hit");
  logToFile(`📥 user: ${JSON.stringify(req.user)}`);
  logToFile(`📥 body: ${JSON.stringify(req.body)}`);
  logToFile(`📂 file: ${req.file ? req.file.filename : "MISSING"}`);

  console.log("👉 /book Endpoint Hit");
  console.log("📥 user:", req.user);
  console.log("📥 body:", req.body);
  console.log("r📂 file:", req.file);

  try {
    const {
      packageId,
      clientName,
      clientEmail,
      clientPhone,
      packageName,
      date,
      guests,
      requests,
      totalAmount,
      paymentStatus,
      transactionId,
      location,
      duration,
      parentRequestId, // ✅ Extracted
      isAddOn, // ✅ Extracted
      cardName, // ✅ Extracted
      last4Digits, // ✅ Extracted
      cabBooking, // ✅ Extracted
      cabBookingPrice, // ✅ Extracted
    } = req.body;

    const clientId = req.user.id;

    let documentPath = "";

    if (req.file) {
      documentPath = `uploads/documents/${req.file.filename}`;
    } else if (req.body.previousDocumentPath) {
      // ✅ Allow reuse of previous document
      documentPath = req.body.previousDocumentPath;
      logToFile(`📂 Reusing document: ${documentPath}`);
    } else {
      logToFile("❌ Missing Document File - req.file is undefined and no previousDocumentPath");
      console.error("❌ Missing Document File");
      return res.status(400).json({ success: false, message: "Document is required." });
    }

    const newRequest = new Request({
      clientId,
      packageId,
      guests,
      date: new Date(date),
      status: "Pending",
      totalAmount,
      transactionId,
      notes: requests,
      clientPhone,
      documentPath: documentPath,
      duration: duration || 1, // ✅ Save duration
      parentRequestId: parentRequestId || null, // ✅ Save linkage
      isAddOn: isAddOn === "true" || isAddOn === true, // ✅ Handle boolean
      paymentInfo: { // ✅ Save Payment Info
        cardName: cardName || "",
        last4Digits: last4Digits || "",
      },
      cabBooking: cabBooking === "true" || cabBooking === true, // ✅ Handle boolean
      cabBookingPrice: cabBookingPrice || 0, // ✅ Save price
    });

    console.log("💾 Saving Request...");
    const savedRequest = await newRequest.save();
    console.log("✅ Request Saved:", savedRequest._id);

    const newTransaction = new Transaction({
      userId: clientId,
      packageId,
      transactionId,
      amount: totalAmount,
      status: paymentStatus === "Completed" ? "Success" : "Pending",
    });

    console.log("💾 Saving Transaction...");
    await newTransaction.save();
    console.log("✅ Transaction Saved");

    // ✅ --- Fetch Parent Trip Details for Email ---
    let previousLocation = "Unknown";
    if (isAddOn && parentRequestId) {
      try {
        const parentRequest = await Request.findById(parentRequestId).populate("packageId");
        if (parentRequest && parentRequest.packageId) {
          previousLocation = parentRequest.packageId.location || parentRequest.packageId.name;
        }
      } catch (err) {
        console.error("Failed to fetch parent request for email:", err);
      }
    }

    const emailData = {
      ...req.body,
      isAddOn: isAddOn === "true" || isAddOn === true,
      previousLocation, // ✅ Add to email data
      createdAt: savedRequest.createdAt,
      _id: savedRequest._id,
    };

    sendBookingConfirmationEmail(clientEmail, emailData).catch(err => {
      console.error("⚠️ Email Error:", err.message);
    });

    res.status(201).json({
      success: true,
      message: "Booking successful! Your request is pending approval.",
      data: savedRequest,
    });
  } catch (err) {
    logToFile(`❌ Create Booking Error Detailed: ${err.message}`);
    logToFile(`❌ Stack: ${err.stack}`);
    console.error("❌ Create Booking Error Detailed:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error while creating booking." });
  }
});


/* ======================================================
👤 USER: Get User’s Bookings (The List)
GET /api/requests/mybookings
====================================================== */
// ... (This route remains the same)
router.get("/mybookings", auth, checkBlocked, async (req, res) => {
  try {
    const bookings = await Request.find({ clientId: req.user.id })
      .populate("packageId", "name isActive image")
      .populate({
        path: "parentRequestId",
        populate: { path: "packageId", select: "name" },
      })
      .sort({ createdAt: -1 });

    const formatted = bookings.map((b) => ({
      _id: b._id,
      packageId: b.packageId?._id,
      packageName: b.packageId?.name || "Deleted Package",
      isPackageActive: b.packageId ? b.packageId.isActive : false,
      packageImage: b.packageId?.image || null,
      date: b.date,
      guests: b.guests,
      status: b.status,
      transactionId: b.transactionId,
      totalAmount: b.totalAmount,
      createdAt: b.createdAt,
      clientPhone: b.clientPhone,
      documentPath: b.documentPath,
      requests: b.notes,
      duration: b.duration || 1,
      isAddOn: b.isAddOn || false, // ✅ Include for UI
      parentTripName: b.parentRequestId?.packageId?.name || null, // ✅ Parent trip name
      cabBooking: b.cabBooking, // ✅ Include Cab Booking
      cabBookingPrice: b.cabBookingPrice, // ✅ Include Price
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error("❌ Fetch Bookings Error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch bookings." });
  }
});


// ✅ --- START: NEW "GET SINGLE BOOKING" ENDPOINT ---
/* ======================================================
ℹ️ USER: Get Single Booking Details
GET /api/requests/details/:id
====================================================== */
router.get("/details/:id", auth, checkBlocked, async (req, res) => {
  try {
    const booking = await Request.findOne({
      _id: req.params.id,
      clientId: req.user.id, // Ensures the user owns this booking
    })
      .populate("clientId", "name email")
      .populate("packageId", "name isActive image location duration"); // Get more package details

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found or unauthorized." });
    }

    // Format the single booking
    const formatted = {
      _id: booking._id,
      clientName: booking.clientId?.name || "Deleted User",
      clientEmail: booking.clientId?.email || "Unknown",
      packageName: booking.packageId?.name || "Deleted Package",
      packageId: booking.packageId?._id,
      isPackageActive: booking.packageId ? booking.packageId.isActive : false,
      packageImage: booking.packageId?.image || null,
      packageLocation: booking.packageId?.location || "N/A",
      packageDuration: booking.packageId?.duration || "N/A",
      date: booking.date,
      guests: booking.guests,
      status: booking.status,
      transactionId: booking.transactionId,
      totalAmount: booking.totalAmount,
      createdAt: booking.createdAt,
      clientPhone: booking.clientPhone,
      requests: booking.notes,
      documentPath: booking.documentPath,
      cabBooking: booking.cabBooking, // ✅ Include Cab Booking
      cabBookingPrice: booking.cabBookingPrice, // ✅ Include Price
      paymentInfo: booking.paymentInfo, // ✅ Include Payment Info
    };

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error("❌ Fetch Single Booking Error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch booking details." });
  }
});
// ✅ --- END: NEW ENDPOINT ---


/* ======================================================
❌ CANCEL BOOKING (User)
POST /api/requests/update/:id
====================================================== */
// ... (This route remains the same)
router.post("/update/:id", auth, checkBlocked, async (req, res) => {
  try {
    const { status } = req.body;
    if (status !== "Cancelled") {
      return res
        .status(400)
        .json({ success: false, message: "User can only cancel bookings." });
    }
    const booking = await Request.findOneAndUpdate(
      { _id: req.params.id, clientId: req.user.id },
      { status: "Cancelled" },
      { new: true }
    );
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found or unauthorized." });
    }
    res.json({
      success: true,
      message: `Booking ${status} successfully.`,
      data: booking,
    });
  } catch (err) {
    console.error("❌ Update Booking Error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to update booking." });
  }
});


/* ======================================================
📧 RESEND INVOICE (User)
POST /api/requests/resend-invoice/:id
====================================================== */
// ... (This route remains the same)
router.post("/resend-invoice/:id", auth, checkBlocked, async (req, res) => {
  try {
    const booking = await Request.findById(req.params.id)
      .populate("clientId", "name email")
      .populate("packageId");
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found." });
    }
    if (!booking.clientId._id.equals(req.user.id)) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized request." });
    }
    const client = booking.clientId;
    const pkg = booking.packageId;
    if (!client || !client.email) {
      return res
        .status(400)
        .json({ success: false, message: "User email not found for invoice." });
    }
    if (!pkg) {
      return res
        .status(400)
        .json({ success: false, message: "Package details not found." });
    }
    const emailData = {
      clientName: client.name,
      clientEmail: client.email,
      clientPhone: booking.clientPhone || "N/A",
      packageName: pkg.name,
      location: pkg.location,
      duration: pkg.duration,
      date: booking.date,
      guests: booking.guests,
      requests: booking.notes,
      totalAmount: booking.totalAmount,
      transactionId: booking.transactionId,
      createdAt: booking.createdAt,
      _id: booking._id,
    };
    await sendBookingConfirmationEmail(client.email, emailData);
    res.json({
      success: true,
      message: `Resent invoice successfully to ${client.email}.`,
    });
  } catch (err) {
    console.error("❌ Resend Invoice Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to resend invoice. Please try again later.",
    });
  }
});


/* ======================================================
🧾 ADMIN: Get All Bookings
GET /api/requests/all
====================================================== */
// ... (This route remains the same)
/* ======================================================
🧾 ADMIN: Get All Bookings
364: GET /api/requests/all
365: ====================================================== */
// ... (This route remains the same)
router.get("/all", adminAuth, async (req, res) => {
  try {
    const bookings = await Request.find()
      .populate("clientId", "name email")
      .populate("packageId")
      .populate({
        path: "parentRequestId",
        populate: { path: "packageId", select: "name location" }, // ✅ Deep populate for context
      })
      .sort({ createdAt: -1 })
      .limit(200);

    const formatted = bookings.map((b) => ({
      _id: b._id,
      clientName: b.clientId?.name || "Deleted User",
      clientEmail: b.clientId?.email || "Unknown",
      packageName: b.packageId?.name || "Deleted Package",
      date: b.date,
      guests: b.guests,
      status: b.status,
      transactionId: b.transactionId,
      totalAmount: b.totalAmount,
      createdAt: b.createdAt,
      clientPhone: b.clientPhone,
      requests: b.notes,
      location: b.packageId?.location,
      duration: b.packageId?.duration,
      documentPath: b.documentPath,
      isAddOn: b.isAddOn || false, // ✅ Include for Admin
      parentTripName: b.parentRequestId?.packageId?.name || null, // ✅ Parent trip name for context
      paymentInfo: b.paymentInfo || null, // ✅ Include Payment Info
      cabBooking: b.cabBooking || false, // ✅ Added for Admin
      cabBookingPrice: b.cabBookingPrice || 0, // ✅ Added for Admin
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error("❌ Admin Fetch Bookings Error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch all bookings." });
  }
});


// ✅ --- START: NEW ADMIN "GET USER BOOKINGS" ENDPOINT ---
/* ======================================================
👤 ADMIN: Get Specific User's Bookings
GET /api/requests/admin/user/:userId
====================================================== */
router.get("/admin/user/:userId", adminAuth, async (req, res) => {
  try {
    const bookings = await Request.find({ clientId: req.params.userId })
      .populate("packageId", "name isActive image location duration")
      .populate({
        path: "parentRequestId",
        populate: { path: "packageId", select: "name" },
      })
      .sort({ createdAt: -1 });

    const formatted = bookings.map((b) => ({
      _id: b._id,
      packageId: b.packageId?._id,
      packageName: b.packageId?.name || "Deleted Package",
      isPackageActive: b.packageId ? b.packageId.isActive : false,
      packageImage: b.packageId?.image || null,
      date: b.date,
      guests: b.guests,
      status: b.status,
      transactionId: b.transactionId,
      totalAmount: b.totalAmount,
      createdAt: b.createdAt, // Important for "Joined" calc if needed, or recent activity
      clientPhone: b.clientPhone,
      isAddOn: b.isAddOn || false,
      parentTripName: b.parentRequestId?.packageId?.name || null,
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error("❌ Admin Fetch User Bookings Error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch user bookings." });
  }
});
// ✅ --- END: NEW ENDPOINT ---



/* ======================================================
🛠️ ADMIN: Update Booking Status
POST /api/requests/admin/update/:id
====================================================== */
// ... (This route remains the same)
router.post("/admin/update/:id", adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (
      !["Pending", "Approved", "Rejected", "Cancelled", "Completed"].includes(status)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status." });
    }
    const booking = await Request.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found." });
    }
    res.json({
      success: true,
      message: `Booking ${status}`,
      data: booking,
    });
  } catch (err) {
    console.error("❌ Admin Update Booking Error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to update booking." });
  }
});


/* ======================================================
🗑️ ADMIN: Delete Booking
DELETE /api/requests/:id
====================================================== */
// ... (This route remains the same)
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const booking = await Request.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found." });
    }
    await Transaction.findOneAndDelete({ transactionId: booking.transactionId });
    res.json({
      success: true,
      message: "Booking and transaction deleted successfully.",
    });
  } catch (err) {
    console.error("❌ Delete Booking Error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete booking." });
  }
});


module.exports = router;