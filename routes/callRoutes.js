const express = require("express");
const router = express.Router();
const {
  initiateCall,
  acceptCall,
  endCall,
  getCall,
  getCalls,
  updateCallStatus,
  generateToken,
  rejectCall,
} = require("../controllers/callController");
const { protect } = require("../middlewares/authMiddleware");

// Generate Agora Token
router.get("/agora-token/:channelName", protect, generateToken);

// Initiate a call
router.post("/initiate", protect, initiateCall);

// Accept call
router.patch("/accept/:callId", protect, acceptCall);

// End call
router.patch("/end/:callId", protect, endCall);

// Get call history
router.get("/history", protect, getCalls);

// Get current call
router.get("/current/:callId", protect, getCall);

// Update call status
router.patch("/status/:callId", protect, updateCallStatus);

module.exports = router;
