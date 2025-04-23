const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const { protect, authorize } = require("../middlewares/authMiddleware");

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Add a console.log to check if the API key is set
console.log("Stripe API Key set:", !!apiKey);

router.post("/create-payment-intent", async (req, res) => {
  const { amount } = req.body;

  console.log("first phase");

  // Add error handling for missing API key
  if (!apiKey) {
    return res.status(500).send({
      error: "Stripe API key is not set in the environment variables.",
    });
  }

  try {
    console.log("second phase");
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
    });

    res.status(200).send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).send({
      error: error.message,
    });
  }
});

router.get(
  "/admin/transactions",
  protect,
  authorize(["admin"]),
  async (req, res) => {
    const { range } = req.query;

    try {
      let startDate;
      const now = new Date();

      switch (range) {
        case "today":
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case "year":
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = new Date(0); // beginning of time
      }

      const payments = await stripe.paymentIntents.list({
        created: { gte: Math.floor(startDate.getTime() / 1000) },
        limit: 100,
        expand: ["data.customer"],
      });

      // Calculate stats
      const stats = {
        totalRevenue: 0,
        successfulPayments: 0,
        failedPayments: 0,
        averageAmount: 0,
      };

      payments.data.forEach((payment) => {
        if (payment.status === "succeeded") {
          stats.totalRevenue += payment.amount / 100;
          stats.successfulPayments++;
        } else {
          stats.failedPayments++;
        }
      });

      stats.averageAmount =
        stats.totalRevenue / (stats.successfulPayments || 1);

      res.json({
        payments: payments.data,
        stats,
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  }
);

router.get("/admin/export", protect, authorize(["admin"]), async (req, res) => {
  try {
    const payments = await stripe.paymentIntents.list({ limit: 100 });

    // Convert to CSV
    const csv = payments.data
      .map((payment) => {
        return `${payment.id},${new Date(
          payment.created * 1000
        ).toISOString()},${payment.amount / 100},${payment.status}`;
      })
      .join("\n");

    const headers = "Transaction ID,Date,Amount,Status\n";

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=payments.csv");
    res.send(headers + csv);
  } catch (error) {
    console.error("Error exporting payments:", error);
    res.status(500).json({ error: "Failed to export payments" });
  }
});

router.get(
  "/admin/dashboard-stats",
  protect,
  authorize(["admin"]),
  async (req, res) => {
    try {
      // Get current date and first day of previous month
      const now = new Date();
      const firstDayOfMonth = Math.floor(
        new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000
      );
      const firstDayOfLastMonth = Math.floor(
        new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime() / 1000
      );

      // Get all payments
      const allPayments = await stripe.paymentIntents.list({
        limit: 100,
      });

      // Get current month payments
      const currentMonthPayments = await stripe.paymentIntents.list({
        created: { gte: firstDayOfMonth },
        limit: 100,
      });

      // Get last month payments
      const lastMonthPayments = await stripe.paymentIntents.list({
        created: {
          gte: firstDayOfLastMonth,
          lt: firstDayOfMonth,
        },
        limit: 100,
      });

      // Calculate total revenue (from succeeded payments only)
      const totalRevenue = allPayments.data
        .filter((payment) => payment.status === "succeeded")
        .reduce((sum, payment) => sum + payment.amount, 0);

      // Calculate current month revenue
      const currentMonthRevenue = currentMonthPayments.data
        .filter((payment) => payment.status === "succeeded")
        .reduce((sum, payment) => sum + payment.amount, 0);

      // Calculate last month revenue
      const lastMonthRevenue = lastMonthPayments.data
        .filter((payment) => payment.status === "succeeded")
        .reduce((sum, payment) => sum + payment.amount, 0);

      // Calculate revenue change percentage
      const revenueChange =
        lastMonthRevenue === 0
          ? 100
          : (
              ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) *
              100
            ).toFixed(1);

      // Get monthly revenue for the last 6 months
      const sixMonthsAgo = Math.floor(
        new Date(now.getFullYear(), now.getMonth() - 5, 1).getTime() / 1000
      );
      const monthlyPayments = await stripe.paymentIntents.list({
        created: { gte: sixMonthsAgo },
        limit: 100,
      });

      // Process monthly revenue
      const monthlyRevenue = monthlyPayments.data
        .filter((payment) => payment.status === "succeeded")
        .reduce((acc, payment) => {
          const date = new Date(payment.created * 1000);
          const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
          if (!acc[key]) acc[key] = 0;
          acc[key] += payment.amount;
          return acc;
        }, {});

      // Convert monthly revenue to array format
      const monthlyRevenueArray = Object.entries(monthlyRevenue).map(
        ([month, total]) => ({
          month,
          total,
        })
      );

      // Calculate payment distribution
      const paymentDistribution = {
        succeeded: allPayments.data.filter((p) => p.status === "succeeded")
          .length,
        failed: allPayments.data.filter((p) => p.status === "failed").length,
        pending: allPayments.data.filter((p) => p.status === "pending").length,
      };

      res.json({
        totalRevenue,
        revenueChange: parseFloat(revenueChange),
        monthlyRevenue: monthlyRevenueArray,
        paymentDistribution,
      });
    } catch (error) {
      console.error("Error fetching payment stats:", error);
      res.status(500).json({ error: "Failed to fetch payment statistics" });
    }
  }
);

module.exports = router;
