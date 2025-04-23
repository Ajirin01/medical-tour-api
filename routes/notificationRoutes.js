const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const {
  getNotifications,
  markAsRead,
} = require("../controllers/notificationController");

const router = express.Router();

router.route("/").get(protect, getNotifications);
router.route("/:id/read").put(protect, markAsRead);

module.exports = router;
