const mongoose = require("mongoose");

const callSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",  // Reference to the UserModel model
      required: true,
    },
    specialist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",  // Reference to the UserModel model (or Specialist/Consultant if needed)
      required: true,
    },
    channelName: { 
      type: String, 
      required: true 
    },
    status: {
      type: String,
      enum: ["pending", "ongoing", "completed"],
      default: "pending",
    },
    startTime: { 
      type: Date, 
      default: Date.now 
    },
    endTime: { 
      type: Date 
    },
    duration: { 
      type: Number,  // Duration in seconds
      required: true 
    },
  },
  { timestamps: true }
);

const Call = mongoose.model("Call", callSchema);
module.exports = Call;
