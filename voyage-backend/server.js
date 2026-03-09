// voyage-backend/server.js

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const startReminderScheduler = require("./daemons/reminderScheduler"); // ✅ Import Scheduler

/* ======================================================
🛡️ Security & Logging Imports
====================================================== */
const helmet = require("helmet");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
// const xss = require("xss-clean"); // ❌ Removed: deprecated, causes UNKNOWN errors on newer Node.js

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

/* ======================================================
🧩 Middleware Configuration
====================================================== */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ 0. CORS - Must be first!
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

// ✅ 1. Secure HTTP Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// ✅ 2. HTTP Request Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ✅ 3. Data Sanitization
app.use(mongoSanitize());
// app.use(xss()); // ❌ Removed: deprecated, causes UNKNOWN errors

// ✅ Serve uploaded files statically
app.use("/uploads", express.static(path.resolve(__dirname, "uploads")));

/* ======================================================
📦 Import Routes
====================================================== */
const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const adminDashboardRoutes = require("./routes/adminDashboard");
const adminUsersRoutes = require("./routes/adminUsers");
const requestRoutes = require("./routes/requests");
const packageRoutes = require("./routes/packages");
const profileRoutes = require("./routes/profile");
const contactRoutes = require("./routes/contact");
const teamRoutes = require("./routes/team");
const testimonialRoutes = require("./routes/testimonials");

/* ======================================================
🧭 Mount Routes
====================================================== */
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/admin", adminDashboardRoutes);
app.use("/api/admin-users", adminUsersRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/ai-chat", require("./routes/aiChat")); // ✅ AI Chat Route

// ✅ User-facing contact form route
app.use("/api/contact", contactRoutes);

// ✅ Admin-facing contact management routes
app.use("/api/admin/contact", contactRoutes);

/* ======================================================
🌍 Default Route
====================================================== */
app.get("/", (req, res) => {
  res.send("🌍 Voyage Tour & Travel API running successfully!");
});

/* ======================================================
⚠️ Error Handling Middleware
====================================================== */
app.use(notFound);
app.use(errorHandler);

/* ======================================================
🚀 Server Initialization
====================================================== */
const PORT = process.env.PORT || 5001;

// Connect to Database
connectDB();

// Start Background Jobs
startReminderScheduler();

app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
