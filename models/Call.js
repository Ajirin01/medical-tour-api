// models/Call.js
const mongoose = require("mongoose");

const callSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    specialistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    channelName: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "ongoing", "completed"],
      default: "pending",
    },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    specialistCategory: { type: String, required: true },
    duration: { type: Number, required: true }, // Duration in seconds
  },
  { timestamps: true }
);

const Call = mongoose.model("Call", callSchema);

module.exports = Call;
