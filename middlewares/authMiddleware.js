const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/medicalTourism/User");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // console.log(decoded)

      // Load the user by ID and ensure discriminator is resolved correctly
      req.user = await User.findById(decoded.userId).select("-password");

      if (!req.user) {
        return res
          .status(401)
          .json({ message: "Not authorized, user not found" });
      }

      // Update lastActiveTime
      req.user.lastActiveTime = new Date();
      await req.user.save();

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
});

const authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Access denied. Insufficient permissions." });
    }
    next();
  };
};

const ensureQuestionsAnswered = (req, res, next) => {
  if (
    req.user.role === "user" &&
    req.user.isHealthQuestionsAnswered === false
  ) {
    return res.status(403).json({
      message: "You must complete the required questions before continuing.",
    });
  }
  next();
};

module.exports = { protect, authorize, ensureQuestionsAnswered };
