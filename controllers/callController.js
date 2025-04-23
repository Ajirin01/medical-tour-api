const Call = require("../models/Call");
const User = require("../models/User");
const { generateAgoraToken } = require("../utils/agora");

const initiateCall = async (req, res) => {
  console.log("Received call initiation request:", req.body);
  const { userId, specialistId, specialistCategory, duration } = req.body;

  const channelName = `call_${Date.now()}`;
  const token = generateAgoraToken(channelName);

  try {
    const call = new Call({
      userId,
      specialistId,
      channelName,
      status: "pending",
      specialistCategory,
      duration,
      startTime: new Date(),
    });

    console.log("Attempting to save call:", call);
    const savedCall = await call.save();
    console.log("Call saved successfully:", savedCall);

    res.json({
      callId: call._id,
      channelName,
      specialistId,
      token,
      duration, // Add this line
    });

    req.io.to(specialistId.toString()).emit("incomingCall", {
      callId: call._id,
      channelName,
      callerId: userId,
      token,
      duration, // Add this line
    });
  } catch (error) {
    console.error("Error initiating call:", error);
    res
      .status(500)
      .json({ message: "Failed to initiate call", error: error.message });
  }
};

const acceptCall = async (req, res) => {
  const { callId } = req.params;

  try {
    const call = await Call.findByIdAndUpdate(
      callId,
      { status: "accepted" },
      { new: true }
    ).populate("userId specialistId");

    if (!call) {
      return res.status(404).json({ message: "Call not found" });
    }

    const token = generateAgoraToken(call.channelName);

    req.io.to(call.userId.toString()).emit("callAccepted", {
      callId: call._id,
      channelName: call.channelName,
      token,
      status: "accepted",
    });

    req.io.to(call.specialistId.toString()).emit("callAccepted", {
      callId: call._id,
      channelName: call.channelName,
      token,
      status: "accepted",
    });

    res.json({
      message: "Call accepted",
      call: { ...call.toObject(), callId: call._id },
      token,
    });
  } catch (error) {
    console.error("Error accepting call:", error);
    res.status(500).json({ message: "Failed to accept call" });
  }
};

const rejectCall = async (req, res) => {
  const { callId } = req.body;

  try {
    const call = await Call.findByIdAndUpdate(
      callId,
      { status: "rejected" },
      { new: true }
    );

    if (!call) {
      return res.status(404).json({ message: "Call not found" });
    }

    req.io
      .to(call.userId.toString())
      .emit("callRejected", { callId: call._id });

    res.json({ message: "Call rejected", call });
  } catch (error) {
    console.error("Error rejecting call:", error);
    res.status(500).json({ message: "Failed to reject call" });
  }
};

const updateCallStatus = async (req, res) => {
  const { callId } = req.params;
  const { status } = req.body;

  if (!callId || !Call.findById(callId)) {
    return res.status(400).json({ error: "Invalid call ID" });
  }

  try {
    const call = await Call.findByIdAndUpdate(
      callId,
      { status },
      { new: true }
    );
    if (!call) {
      return res.status(404).json({ error: "Call not found" });
    }
    res.json(call);
  } catch (error) {
    console.error("Error updating call status:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getCall = async (req, res) => {
  const { callId } = req.params;

  if (!Call.findById(callId)) {
    return res.status(400).json({ error: "Invalid call ID" });
  }

  try {
    const call = await Call.findById(callId)
      .populate("userId", "name email")
      .populate("specialistId", "name email specialistCategory");

    if (!call) {
      return res.status(404).json({ error: "Call not found" });
    }

    res.json(call);
  } catch (error) {
    console.error("Error fetching call:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getCalls = async (req, res) => {
  console.log("Received getCalls request:", req.query);
  const {
    userId,
    specialistId,
    status,
    specialistCategory,
    startDate,
    endDate,
  } = req.query;
  const query = {};

  if (userId) query.userId = userId;
  if (specialistId) query.specialistId = specialistId;
  if (status) query.status = status;
  if (specialistCategory) query.specialistCategory = specialistCategory;

  if (startDate && endDate) {
    query.startTime = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  try {
    const calls = await Call.find(query)
      .populate("userId", "name email")
      .populate("specialistId", "name email specialistCategory")
      .sort({ startTime: -1 });

    if (calls.length === 0) {
      return res.status(404).json({ message: "No calls found" });
    }

    res.json(calls);
  } catch (error) {
    console.error("Error fetching calls:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const endCall = async (req, res) => {
  const { callId } = req.params;

  if (!callId || !Call.findById(callId)) {
    return res.status(400).json({ error: "Invalid call ID" });
  }

  try {
    const call = await Call.findByIdAndUpdate(
      callId,
      { status: "completed", endTime: new Date.now() },
      { new: true }
    );

    if (!call) {
      return res.status(404).json({ message: "Call not found" });
    }

    // Notify both users that the call has ended
    req.io.to(call.userId.toString()).emit("callEnded", {
      callId: call._id,
      channelName: call.channelName,
    });

    req.io.to(call.specialistId.toString()).emit("callEnded", {
      callId: call._id,
      channelName: call.channelName,
    });

    res.json({ message: "Call ended", call });
  } catch (error) {
    console.error("Error ending call:", error);
    res.status(500).json({ message: "Failed to end call" });
  }
};

const generateToken = async (req, res) => {
  const { channelName } = req.params;
  try {
    console.log("Generating token for channel:", channelName);
    const token = generateAgoraToken(channelName);
    const appId = process.env.AGORA_APP_ID;
    console.log("Generated token and appId:", { token, appId, channelName });
    res.json({ token, appId, channelName });
  } catch (error) {
    console.error("Error generating Agora token:", error);
    res.status(500).json({ message: "Failed to generate Agora token" });
  }
};

const searchCalls = async (req, res) => {
  const { search, status, startDate, endDate } = req.query;
  const query = {};

  if (search) {
    query.$or = [
      { "userId.name": { $regex: search, $options: "i" } },
      { "specialistId.name": { $regex: search, $options: "i" } },
      { specialistCategory: { $regex: search, $options: "i" } },
    ];
  }

  if (status) query.status = status;
  if (startDate && endDate) {
    query.startTime = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  try {
    const calls = await Call.find(query)
      .populate("userId", "name email")
      .populate("specialistId", "name email specialistCategory")
      .sort({ startTime: -1 });

    res.json(calls);
  } catch (error) {
    console.error("Error searching calls:", error);
    res.status(500).json({ message: "Failed to search calls" });
  }
};

module.exports = {
  initiateCall,
  acceptCall,
  rejectCall,
  updateCallStatus,
  generateToken,
  getCall,
  getCalls,
  endCall, // Add this to the exports
  searchCalls,
};
