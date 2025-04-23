// routes/adminRoutes.js
const express = require("express");
const { registerAdmin, authAdmin } = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");
const User = require("../models/User");
const { getUsers } = require("../controllers/adminController");

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", authAdmin);

router.get("/check-unapproved", async (req, res) => {
  const users = await User.find({ isApproved: false });
  res.json(!!users);
});

// Protect all routes below with adminProtect
router.route("/unapproved-specialists").get(protect, async (req, res) => {
  const users = await User.find({ role: "specialist", isApproved: false });
  res.json(users);
});

router.route("/fetch-user/:userId").get(protect, async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  res.json(user);
});

router.route("/approve-user/:userId").patch(protect, async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  user.isApproved = true;
  await user.save();
  res.json(user);
});

router.get("/get-users", protect, getUsers);

// Add this new endpoint
router.get("/dashboard-stats", protect, async (req, res) => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );

    // Get total users (excluding admins)
    const totalUsers = await User.countDocuments({ role: { $ne: "admin" } });

    // Get users registered this month
    const currentMonthUsers = await User.countDocuments({
      role: { $ne: "admin" },
      createdAt: { $gte: firstDayOfMonth },
    });

    // Get users registered last month
    const lastMonthUsers = await User.countDocuments({
      role: { $ne: "admin" },
      createdAt: {
        $gte: firstDayOfLastMonth,
        $lt: firstDayOfMonth,
      },
    });

    // Get monthly user registration for the last 6 months
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const monthlyUsers = await User.aggregate([
      {
        $match: {
          role: { $ne: "admin" },
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          patients: {
            $sum: {
              $cond: [{ $eq: ["$role", "user"] }, 1, 0],
            },
          },
          specialists: {
            $sum: {
              $cond: [{ $eq: ["$role", "specialist"] }, 1, 0],
            },
          },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Calculate user growth percentage
    const userGrowth =
      lastMonthUsers === 0
        ? 100
        : (
            ((currentMonthUsers - lastMonthUsers) / lastMonthUsers) *
            100
          ).toFixed(1);

    res.json({
      totalUsers,
      userGrowth: parseFloat(userGrowth),
      monthlyUsers: monthlyUsers.map((item) => ({
        month: `${item._id.year}-${item._id.month}`,
        patients: item.patients,
        specialists: item.specialists,
      })),
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
});

module.exports = router;
