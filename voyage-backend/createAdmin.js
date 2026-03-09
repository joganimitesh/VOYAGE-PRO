// ✅ voyage-backend/createAdmin.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const AdminUser = require("./models/AdminUser");

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ Missing MONGO_URI in .env");
  process.exit(1);
}

const createAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const existing = await AdminUser.findOne({ username: "admin" });
    if (existing) {
      console.log("⚠️ Admin already exists — deleting old one...");
      await AdminUser.deleteOne({ username: "admin" });
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    const admin = new AdminUser({
      username: "admin",
      password: hashedPassword,
      role: "admin",
    });

    await admin.save();
    console.log("🎉 Admin created successfully!");
    console.log("🧾 Username: admin");
    console.log("🔑 Password: admin123");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating admin:", err.message);
    process.exit(1);
  }
};

createAdmin();
