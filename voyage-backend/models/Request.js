const mongoose = require("mongoose");

const RequestSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },
    guests: {
      type: Number,
      required: true,
      min: 1,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled", "Completed"],
      default: "Pending",
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    transactionId: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    clientPhone: {
      type: String,
      default: "",
      trim: true,
    },
    // ✅ --- ADDED THIS FIELD ---
    documentPath: {
      type: String,
      trim: true,
    },
    // ✅ --- ADD-ON FIELDS ---
    parentRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      default: null,
    },
    isAddOn: {
      type: Boolean,
      default: false,
    },
    duration: {
      type: Number, // Stored in days
      required: true,
      min: 1,
    },
    // ✅ --- END ADD-ON FIELDS ---
    // ✅ --- END ADD-ON FIELDS ---
    paymentInfo: {
      cardName: { type: String, default: "" },
      last4Digits: { type: String, default: "" },
    },
    // ✅ --- CUSTOM PACKAGE FIELDS ---
    isCustom: {
      type: Boolean,
      default: false,
    },
    // ✅ --- OPTIONAL SERVICES ---
    cabBooking: {
      type: Boolean,
      default: false,
    },
    cabBookingPrice: {
      type: Number,
      default: 0,
    },
    // ✅ --- END OPTIONAL SERVICES ---
    selectedPlaces: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Place",
      },
    ],
    // ✅ --- END OF ADDITION ---
  },
  { timestamps: true }
);

module.exports = mongoose.model("Request", RequestSchema);
