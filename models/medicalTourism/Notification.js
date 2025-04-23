const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
    },
    content: {
      type: String,
      required: true, // The message/content of the notification
    },
    isRead: {
      type: Boolean,
      default: false, // Tracks whether the notification has been read
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
