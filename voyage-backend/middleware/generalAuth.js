// voyage-backend/middleware/generalAuth.js
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

/**
 * Middleware: Authenticate *any* user (Client or Admin)
 * This middleware only decodes the token and attaches the payload.
 * It does NOT query the database.
 */
module.exports = function (req, res, next) {
  try {
    // Extract token from header
    const token =
      req.header("x-auth-token") ||
      req.headers.authorization?.split(" ")[1] ||
      null;

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided. Authorization denied." });
    }

    // Verify JWT
    const secret = process.env.JWT_SECRET || "secret123";
    try {
      const decoded = jwt.verify(token, secret);
      req.user = decoded;
      // console.log("✅ Auth Success:", decoded.id); // Uncomment for verbose
      next();
    } catch (e) {
      console.error("❌ Token Verification Failed:", e.message);
      throw e; // Let catch block handle response
    }

  } catch (err) {
    console.error("❌ General Auth middleware error:", err.message);
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token." });
  }
};
