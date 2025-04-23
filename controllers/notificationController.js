const Notification = require("../models/Notification");
const asyncHandler = require("express-async-handler");

const getNotifications = asyncHandler(async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications" });
  }
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }

  res.json(notification);
});

const createNotification = asyncHandler(async (userId, notificationData) => {
  const notification = new Notification({
    user: userId,
    ...notificationData,
  });
  await notification.save();

  const io = require("../utils/socket").getIO();
  io.to(`notification_${userId}`).emit("newNotification", notification);

  return notification;
});

module.exports = {
  getNotifications,
  markAsRead,
  createNotification,
};
