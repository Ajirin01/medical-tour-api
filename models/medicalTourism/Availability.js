const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
    },

    // Optional: to distinguish between recurring or specific availability
    type: {
      type: String,
      enum: ["recurring", "one-time"],
      default: "recurring",
    },

    // For recurring: use day of week
    dayOfWeek: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
    },

    // For one-time: use a specific date
    date: {
      type: Date,
    },

    startTime: {
      type: String, // e.g., "09:00"
      required: true,
    },
    endTime: {
      type: String, // e.g., "17:00"
      required: true,
    },

    isBooked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Availability = mongoose.model("Availability", availabilitySchema);

module.exports = Availability;