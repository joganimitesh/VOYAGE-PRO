// voyage-backend/models/Client.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ClientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },

    bio: {
      type: String,
      default: "Adventure seeker | World traveler",
      trim: true,
    },

    profileImage: {
      type: String,
      default: "uploads/default-avatar.png",
    },

    isBlocked: { type: Boolean, default: false },
    otp: { type: String },
    otpExpires: { type: Date },

    socialLinks: {
      instagram: { type: String, default: "" },
      facebook: { type: String, default: "" },
      linkedin: { type: String, default: "" },
    },

    savedPackages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Package",
      },
    ],
    
    // ✅ --- START: NEW "LIKED" FEATURE ---
    likedPackages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Package",
      },
    ],
    // ✅ --- END: NEW "LIKED" FEATURE ---
  },
  {
    timestamps: true,
  }
);

// ... (rest of the file, matchPassword, etc.)
ClientSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

ClientSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Client", ClientSchema);