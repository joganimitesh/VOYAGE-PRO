const mongoose = require("mongoose");

const PlaceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        state: {
            type: String,
            required: true,
            trim: true,
            index: true, // For faster filtering by state
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        image: {
            type: String,
            required: true,
            trim: true,
        },
        coordinates: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
        },
        estimatedPrice: {
            type: Number,
            default: 0,
        },
        rating: {
            type: Number,
            default: 4.5,
        },
        category: {
            type: String,
            trim: true,
            default: "General",
        },
        visitDuration: {
            type: String,
            trim: true,
        },
        historicalSignificance: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Place", PlaceSchema);
