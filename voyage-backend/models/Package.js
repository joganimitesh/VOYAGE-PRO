const mongoose = require("mongoose");

const PackageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // Package name
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    duration: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    location: { type: String, trim: true },
    // ✅ Coordinates for Map
    coordinates: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    // ✅ Calculated Average Rating
    rating: { type: Number, default: 0 },

    // ✅ Real User Reviews
    reviews: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
        userName: { type: String, required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    highlights: [{ type: String, trim: true }],
  },
  {
    timestamps: true, // Automatically adds createdAt & updatedAt
  }
);

module.exports = mongoose.model("Package", PackageSchema);
