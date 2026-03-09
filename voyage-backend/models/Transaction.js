// voyage-backend/models/Transaction.js
const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMode: {
      type: String,
      enum: ["Online", "Offline", "Card", "UPI", "NetBanking", "Cash"],
      default: "Online",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Success", "Failed", "Pending", "Refunded"],
      default: "Success",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", TransactionSchema);
