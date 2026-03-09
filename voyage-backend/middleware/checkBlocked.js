// voyage-backend/middleware/checkBlocked.js
const Client = require("../models/Client");

/**
 * Middleware: Prevent blocked users from accessing protected routes.
 */
const checkBlocked = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized access. No user found." });
    }

    const user = await Client.findById(userId).select("isBlocked name email");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked by an administrator.",
      });
    }

    next();
  } catch (err) {
    console.error("❌ Block check error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error while verifying block status.",
    });
  }
};

module.exports = { checkBlocked };
