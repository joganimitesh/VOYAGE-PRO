// voyage-backend/models/Contact.js
const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["Pending", "Responded"],
      default: "Pending",
    },
    responseText: { type: String, trim: true },
    respondedAt: { type: Date },
  },
  {
    timestamps: true, // automatically adds createdAt & updatedAt
  }
);

module.exports = mongoose.model("Contact", ContactSchema);
