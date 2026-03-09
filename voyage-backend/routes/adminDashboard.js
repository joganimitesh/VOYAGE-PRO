// src/routes/adminDashboardRoutes.js
const express = require("express");
const adminAuth = require("../middleware/adminAuth");
const Client = require("../models/Client");
const Request = require("../models/Request");
const Transaction = require("../models/Transaction");
const Package = require("../models/Package");

const router = express.Router();

/**
 * Helper: Create a date $match object for aggregations
 * (This helper function is correct)
 */
const createDateMatch = (query, dateField = "createdAt") => {
  const match = {};
  if (query.startDate && query.endDate) {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    endDate.setHours(23, 59, 59, 999); // Inclusive end-of-day

    match[dateField] = {
      $gte: startDate,
      $lte: endDate,
    };
  }
  return match;
};

/* ======================================================
📊 ADMIN DASHBOARD STATS
====================================================== */
router.get("/dashboard/stats", adminAuth, async (req, res) => {
  try {
    const requestDateMatch = createDateMatch(req.query, "createdAt");

    const totalUsers = await Client.countDocuments({});
    const totalPackages = await Package.countDocuments({ isActive: true });

    const totalBookings = await Request.countDocuments({
      ...requestDateMatch,
      status: { $nin: ["Cancelled", "Rejected"] },
    });

    const revenueAgg = await Request.aggregate([
      {
        $match: {
          ...requestDateMatch,
          status: { $in: ["Approved", "Completed"] },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;

    res.json({
      totalUsers,
      totalPackages,
      totalBookings,
      totalRevenue,
    });
  } catch (err) {
    console.error("❌ Admin Stats Error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to load admin statistics." });
  }
});

/* ======================================================
💰 TRANSACTIONS DATA (for table)
====================================================== */
router.get("/transactions", adminAuth, async (req, res) => {
  try {
    const requestDateMatch = createDateMatch(req.query, "createdAt");

    const requests = await Request.find(requestDateMatch)
      .populate("clientId", "name email")
      .populate("packageId", "name")
      .sort({ createdAt: -1 })
      .limit(100);

    const formatted = requests.map((t) => ({
      _id: t._id,
      userName: t.clientId?.name || "Deleted User",
      packageName: t.packageId?.name || "Deleted Package",
      amount: t.totalAmount,
      transactionId: t.transactionId,
      status: t.status,
      date: t.createdAt,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("❌ Admin Transactions Error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to load transactions." });
  }
});

/* ======================================================
📅 BOOKINGS BY MONTH (Chart)
====================================================== */
router.get("/dashboard/bookings-by-month", adminAuth, async (req, res) => {
  try {
    const requestDateMatch = createDateMatch(req.query, "createdAt");

    const { startDate, endDate } = req.query;
    let durationInDays = 999;
    if (startDate && endDate) {
      durationInDays =
        (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
    }
    const isShortRange = durationInDays <= 31;

    const groupStage = {
      _id: isShortRange
        ? {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          }
        : {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
      count: { $sum: 1 },
    };

    const projectStage = {
      _id: 0,
      label: isShortRange
        ? {
            $concat: [
              { $toString: "$_id.day" },
              "-",
              {
                $let: {
                  vars: {
                    months: [
                      "",
                      "Jan",
                      "Feb",
                      "Mar",
                      "Apr",
                      "May",
                      "Jun",
                      "Jul",
                      "Aug",
                      "Sep",
                      "Oct",
                      "Nov",
                      "Dec",
                    ],
                  },
                  in: { $arrayElemAt: ["$$months", "$_id.month"] },
                },
              },
            ],
          }
        : {
            $let: {
              vars: {
                months: [
                  "",
                  "Jan",
                  "Feb",
                  "Mar",
                  "Apr",
                  "May",
                  "Jun",
                  "Jul",
                  "Aug",
                  "Sep",
                  "Oct",
                  "Nov",
                  "Dec",
                ],
              },
              in: { $arrayElemAt: ["$$months", "$_id.month"] },
            },
          },
      count: 1,
    };

    const sortStage = isShortRange
      ? { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
      : { "_id.year": 1, "_id.month": 1 };

    const bookings = await Request.aggregate([
      {
        $match: {
          ...requestDateMatch,
          status: { $nin: ["Cancelled", "Rejected"] },
        },
      },
      { $group: groupStage },
      { $sort: sortStage },
      { $project: projectStage },
    ]);

    res.json(bookings);
  } catch (err) {
    console.error("❌ Bookings by Month Error:", err.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

/* ======================================================
💸 REVENUE BY MONTH (Chart)
====================================================== */
router.get("/dashboard/revenue-by-month", adminAuth, async (req, res) => {
  try {
    const requestDateMatch = createDateMatch(req.query, "createdAt");

    const { startDate, endDate } = req.query;
    let durationInDays = 999;
    if (startDate && endDate) {
      durationInDays =
        (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
    }
    const isShortRange = durationInDays <= 31;

    const groupStage = {
      _id: isShortRange
        ? {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          }
        : {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
      revenue: { $sum: "$totalAmount" },
    };

    const projectStage = {
      _id: 0,
      label: isShortRange
        ? {
            $concat: [
              { $toString: "$_id.day" },
              "-",
              {
                $let: {
                  vars: {
                    months: [
                      "",
                      "Jan",
                      "Feb",
                      "Mar",
                      "Apr",
                      "May",
                      "Jun",
                      "Jul",
                      "Aug",
                      "Sep",
                      "Oct",
                      "Nov",
                      "Dec",
                    ],
                  },
                  in: { $arrayElemAt: ["$$months", "$_id.month"] },
                },
              },
            ],
          }
        : {
            $let: {
              vars: {
                months: [
                  "",
                  "Jan",
                  "Feb",
                  "Mar",
                  "Apr",
                  "May",
                  "Jun",
                  "Jul",
                  "Aug",
                  "Sep",
                  "Oct",
                  "Nov",
                  "Dec",
                ],
              },
              in: { $arrayElemAt: ["$$months", "$_id.month"] },
            },
          },
      revenue: 1,
    };

    const sortStage = isShortRange
      ? { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
      : { "_id.year": 1, "_id.month": 1 };

    const revenue = await Request.aggregate([
      {
        $match: {
          ...requestDateMatch,
          status: { $in: ["Approved", "Completed"] },
        },
      },
      { $group: groupStage },
      { $sort: sortStage },
      { $project: projectStage },
    ]);

    res.json(revenue);
  } catch (err) {
    console.error("❌ Revenue by Month Error:", err.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

/* ======================================================
🌍 TOP PACKAGES (Chart)
====================================================== */
router.get("/dashboard/top-packages", adminAuth, async (req, res) => {
  try {
    const requestDateMatch = createDateMatch(req.query, "createdAt");

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
      {
        $lookup: {
          from: "packages",
          localField: "_id",
          foreignField: "_id",
          as: "packageDetails",
        },
      },
      {
        $unwind: {
          path: "$packageDetails",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $project: {
          _id: 0,
          packageName: { $ifNull: ["$packageDetails.name", "Deleted Package"] },
          count: 1,
        },
      },
    ]);

    res.json(topPackages);
  } catch (err) {
    console.error("❌ Top Packages Error:", err.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

/* ======================================================
📊 TOP CATEGORIES (New Chart)
====================================================== */
router.get("/dashboard/top-categories", adminAuth, async (req, res) => {
  try {
    const requestDateMatch = createDateMatch(req.query, "createdAt");

    const topCategories = await Request.aggregate([
      {
        $match: {
          ...requestDateMatch,
          status: { $in: ["Approved", "Completed"] },
        },
      },
      {
        $lookup: {
          from: "packages",
          localField: "packageId",
          foreignField: "_id",
          as: "packageDetails",
        },
      },
      {
        $unwind: {
          path: "$packageDetails",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $group: {
          _id: { $ifNull: ["$packageDetails.category", "Uncategorized"] },
          revenue: { $sum: "$totalAmount" },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          revenue: 1,
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]);

    res.json(topCategories);
  } catch (err) {
    console.error("❌ Top Categories Error:", err.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
