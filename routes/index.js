const express = require("express");

const userRoutes = require("./userRoutes");

const callRoutes = require("./callRoutes");

const chatbotRoutes = require("./chatbotRoutes");

const paymentRoutes = require("./paymentRoutes");

const blogRoutes = require("./blogRoutes");

const adminRoutes = require("./adminRoutes");

const appointmentRoutes = require("./appointmentRoutes");

const notificationRoutes = require("./notificationRoutes");

const tourism = require("./medicalTourismRoutes");

const router = express.Router();

router.use(`/users`, userRoutes);

// router.user('/users', (req, res) => {
//   console.log('it is working ')
//   res.json({ message: 'This is the get-calls route' });
// });

router.use(`/calls`, callRoutes);

router.use(`/chatbot`, chatbotRoutes);

router.use(`/payment`, paymentRoutes);

router.use(`/blogs`, blogRoutes);

router.use("/admin", adminRoutes);

router.use("/appointments", appointmentRoutes);

router.use("/notifications", notificationRoutes);

router.use("/medical-tourism", tourism);

module.exports = router;
