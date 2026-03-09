// voyage-backend/models/TeamMember.js
const mongoose = require("mongoose");

const TeamMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
  },
  {
    timestamps: true, // automatically adds createdAt & updatedAt
  }
);

module.exports = mongoose.model("TeamMember", TeamMemberSchema);
