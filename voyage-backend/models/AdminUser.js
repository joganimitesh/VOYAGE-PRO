// ✅ voyage-backend/models/AdminUser.js
const mongoose = require("mongoose");

const AdminUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "admin" },
});

// ✅ Ensure we’re reading the same “admins” collection as in MongoDB
module.exports = mongoose.model("AdminUser", AdminUserSchema, "admins");
