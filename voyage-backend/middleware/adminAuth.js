// voyage-backend/middleware/adminAuth.js
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const AdminUser = require("../models/AdminUser");

dotenv.config();

/**
 * Middleware: Authenticate Admin Users
 */
module.exports = async function (req, res, next) {
  try {
    // Extract token from headers
    let token =
      req.header("x-auth-token") ||
      req.headers.authorization?.split(" ")[1] ||
      null;

    // If not found, deny access
    if (!token) {
      console.log("❌ AdminAuth: No token provided");
      return res
        .status(401)
        .json({ success: false, message: "No token provided. Authorization denied." });
    }

    // Verify token
    const secret = process.env.JWT_SECRET || "secret123";
    try {
      const decoded = jwt.verify(token, secret);
      console.log("✅ AdminAuth: Token verified", decoded);

      // Find admin in DB
      const admin = await AdminUser.findById(decoded.id);

      if (!admin) {
        console.log("❌ AdminAuth: Admin not found in DB for ID:", decoded.id);
        return res
          .status(403)
          .json({ success: false, message: "Admin not found or unauthorized." });
      }

      // Attach admin details to request object
      req.admin = { id: admin._id, email: admin.email, name: admin.name };
      next();
    } catch (e) {
      console.log("❌ AdminAuth: Token verification failed", e.message);
      throw e;
    }
  } catch (err) {
    console.error("❌ Admin auth error:", err.message);
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired admin token." });
  }
};
