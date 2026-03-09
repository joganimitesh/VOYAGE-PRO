const mongoose = require("mongoose");
const Request = require("./models/Request");
const Package = require("./models/Package");
require("dotenv").config();

const debugAggregation = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/voyage-db");
        console.log("Connected to DB");

        // 1. Simulate "All Time" query params
        const startDate = null;
        const endDate = null;

        // 2. Logic from adminDashboard.js
        const requestDateMatch = {}; // Empty match for all time

        console.log("--- DEBUG: BOOKINGS BY MONTH ---");
        const bookings = await Request.aggregate([
            {
                $match: {
                    ...requestDateMatch,
                    status: { $nin: ["Cancelled", "Rejected"] },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                    },
                    count: { $sum: 1 },
                }
            },
        ]);
        console.log("Bookings Result:", JSON.stringify(bookings, null, 2));


        console.log("--- DEBUG: REVENUE BY MONTH ---");
        const revenue = await Request.aggregate([
            {
                $match: {
                    ...requestDateMatch,
                    status: { $in: ["Approved", "Completed"] },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                    },
                    revenue: { $sum: "$totalAmount" },
                }
            }
        ]);
        console.log("Revenue Result:", JSON.stringify(revenue, null, 2));


        console.log("--- DEBUG: TOP PACKAGES ---");
        const topPackages = await Request.aggregate([
            {
                $match: {
                    ...requestDateMatch,
                    status: { $nin: ["Cancelled", "Rejected"] },
                },
            },
            { $group: { _id: "$packageId", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            // Simplified lookup for debug
            {
                $lookup: {
                    from: "packages",
                    localField: "_id",
                    foreignField: "_id",
                    as: "packageDetails",
                },
            },
        ]);
        console.log("Top Packages Result:", JSON.stringify(topPackages, null, 2));


        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

debugAggregation();
