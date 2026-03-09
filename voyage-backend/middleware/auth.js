// voyage-backend/middleware/auth.js
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const Client = require("../models/Client");

dotenv.config();

/**
 * Middleware: Authenticate Client (regular) users
 */
module.exports = async function (req, res, next) {
  try {
    // Extract token from header
    let token =
      req.header("x-auth-token") ||
      req.headers.authorization?.split(" ")[1] ||
      null;

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided. Authorization denied." });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find client by ID
    const client = await Client.findById(decoded.id);
    if (!client) {
      return res
        .status(403)
        .json({ success: false, message: "Client not found or unauthorized." });
    }

    // Attach to request
    req.user = { id: client._id, email: client.email, name: client.name };

    next();
  } catch (err) {
    console.error("❌ Auth middleware error:", err.message);
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token." });
  }
};
