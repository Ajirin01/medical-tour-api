const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const verifyRecaptcha = require("../utils/recaptcha");
const sendEmail = require("../utils/sendEmail");
const getPasswordResetTemplate = require('../templates/passwordResetTemplate');
const crypto = require("crypto");
const path = require("path");
const { exit } = require("process");

// Register Admin
const registerAdmin = async (req, res) => {
  const { firstName, lastName, email, adminPassword } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const admin = new User({
      role: "admin",
      firstName,
      lastName,
      email,
      password: adminPassword,
      adminPassword
    });

    // console.log(admin)

    const createdAdmin = await admin.save();
    res.status(201).json(createdAdmin);
  } catch (error) {
    console.error("Error registering admin:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Authenticate Admin
const authAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await User.findOne({ email, role: "admin" });

    if (admin) {
      console.log("see admin here oh");
    } else {
      console.log("baba no admin here oh");
    }

    if (admin && (await admin.matchAdminPassword(password))) {
      res.json({
        _id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role,
        token: generateToken(admin._id),
      });
    } else {
      res
        .status(401)
        .json({ message: "Invalid email or password or admin password" });
    }
  } catch (error) {
    console.error("Error authenticating admin:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Register User or Specialist
const registerUser = asyncHandler(async (req, res) => {
  const {
    role,
    firstName,
    lastName,
    dateOfBirth,
    gender,
    address,
    country,
    email,
    phone,
    password,
    agreeTerms,
    recaptcha,
    specialistCategory,
    isOnline,
    doctorRegistrationNumber,
  } = req.body;

  console.log(req.body)
  return;

  // Validate reCAPTCHA
  const recaptchaValid = await verifyRecaptcha(recaptcha);
  if (!recaptchaValid) {
    res.status(400);
    throw new Error("reCAPTCHA validation failed. Please try again.");
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  let practicingLicense;
  if (req.file) {
    practicingLicense = "/uploads/licenses/" + path.basename(req.file.path);
  }

  const user = await User.create({
    role,
    firstName,
    lastName,
    dateOfBirth,
    gender,
    address,
    country,
    email,
    phone,
    password,
    agreeTerms,
    specialistCategory: role === "specialist" ? specialistCategory : undefined,
    isOnline: role === "specialist" ? isOnline : undefined,
    doctorRegistrationNumber:
      role === "specialist" ? doctorRegistrationNumber : undefined,
    practicingLicense: role === "specialist" ? practicingLicense : undefined,
  });

  const otp = user.generateOTP();
  await user.save();

  await sendEmail({
    to: user.email,
    subject: "Your One-Time Password for Global Health Solutions",
    otpCode: otp,
  });

  res.status(201).json({
    message:
      "Registration successful. Please check your email for the OTP to verify your account.",
  });
});

// Verify OTP
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });

  if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
    res.status(400);
    throw new Error("Invalid or expired OTP");
  }

  user.otp = undefined;
  user.otpExpires = undefined;
  user.isEmailVerified = true;
  await user.save();

  res.status(200).json({
    message: "OTP verified successfully",
    token: generateToken(user._id),
  });
});

// Resend OTP
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(400);
    throw new Error("User not found");
  }

  const otp = user.generateOTP();
  await user.save();

  await sendEmail({
    to: user.email,
    subject: "Your New One-Time Password for Global Health Solutions",
    otpCode: otp,
  });

  res.status(200).json({
    message:
      "OTP resent successfully. Please check your email for the new OTP.",
  });
});

// Authenticate user & get token
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      address: user.address,
      country: user.country,
      email: user.email,
      phone: user.phone,
      agreeTerms: user.agreeTerms,
      certifications: user.certifications,
      isApproved: user.isApproved,
      loginTime: user.loginTime,
      isEmailVerified: user.isEmailVerified,
      otp: user.otp,
      otpExpires: user.otpExpires,
      resetPasswordToken: user.resetPasswordToken,
      resetPasswordExpires: user.resetPasswordExpires,
      isOnline: user.isOnline,
      specialistCategory: user.specialistCategory,
      profileImage: user.profileImage,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// Request password reset
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(400).json({ message: "User not found" });
    throw new Error("User not found");
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save();

  const resetUrl = `${req.protocol}://${process.env.FRONTEND_URL}/auth/reset-password/${resetToken}`;
  const text = `Click this link to reset your password: ${resetUrl}`;
  const html = getPasswordResetTemplate(resetUrl);
  
  await sendEmail({
    to: user.email,
    subject: "Password Reset Request - Global Health Solutions",
    text,
    html,
  });
  res.status(200).json({
    message: "Password reset email sent",
  });
});

// Reset password
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400).json({ message: "Invalid or expired password reset token" });;
    throw new Error("Invalid or expired password reset token");
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({
    message: "Password reset successful",
  });
});

// Get user profile
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      address: user.address,
      country: user.country,
      email: user.email,
      phone: user.phone,
      agreeTerms: user.agreeTerms,
      practicingLicense: user.practicingLicense,
      doctorRegistrationNumber: user.doctorRegistrationNumber,
      isApproved: user.isApproved,
      loginTime: user.loginTime,
      isEmailVerified: user.isEmailVerified,
      otp: user.otp,
      otpExpires: user.otpExpires,
      resetPasswordToken: user.resetPasswordToken,
      resetPasswordExpires: user.resetPasswordExpires,
      isOnline: user.isOnline,
      specialistCategory: user.specialistCategory,
      profileImage: user.profileImage,
      token: generateToken(user._id),
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// Update user profile
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.role = req.body.role || user.role;
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.dateOfBirth = req.body.dateOfBirth || user.dateOfBirth;
    user.gender = req.body.gender || user.gender;
    user.address = req.body.address || user.address;
    user.country = req.body.country || user.country;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.agreeTerms =
      req.body.agreeTerms !== undefined ? req.body.agreeTerms : user.agreeTerms;
    user.doctorRegistrationNumber =
      req.body.doctorRegistrationNumber || user.doctorRegistrationNumber;
    user.isEmailVerified =
      req.body.isEmailVerified !== undefined
        ? req.body.isEmailVerified
        : user.isEmailVerified;
    user.isApproved =
      req.body.isApproved !== undefined ? req.body.isApproved : user.isApproved;
    user.isOnline =
      req.body.isOnline !== undefined ? req.body.isOnline : user.isOnline;
    user.specialistCategory =
      req.body.specialistCategory || user.specialistCategory;

    if (req.files) {
      if (req.files["profileImage"]) {
        user.profileImage =
          "/uploads/profile-images/" +
          path.basename(req.files["profileImage"][0].path);
      }
      if (req.files["currentPracticingLicense"]) {
        user.practicingLicense =
          "/uploads/licenses/" +
          path.basename(req.files["currentPracticingLicense"][0].path);
      }
    }

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      role: updatedUser.role,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      dateOfBirth: updatedUser.dateOfBirth,
      gender: updatedUser.gender,
      address: updatedUser.address,
      country: updatedUser.country,
      email: updatedUser.email,
      phone: updatedUser.phone,
      agreeTerms: updatedUser.agreeTerms,
      practicingLicense: updatedUser.practicingLicense,
      doctorRegistrationNumber: updatedUser.doctorRegistrationNumber,
      isApproved: updatedUser.isApproved,
      loginTime: updatedUser.loginTime,
      isEmailVerified: updatedUser.isEmailVerified,
      otp: updatedUser.otp,
      otpExpires: updatedUser.otpExpires,
      resetPasswordToken: updatedUser.resetPasswordToken,
      resetPasswordExpires: updatedUser.resetPasswordExpires,
      isOnline: updatedUser.isOnline,
      specialistCategory: updatedUser.specialistCategory,
      profileImage: updatedUser.profileImage,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// Update user availability
const updateUserAvailability = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user && user.role === "specialist") {
    user.isOnline = !user.isOnline;
    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      role: updatedUser.role,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      dateOfBirth: updatedUser.dateOfBirth,
      gender: updatedUser.gender,
      address: updatedUser.address,
      country: updatedUser.country,
      email: updatedUser.email,
      phone: updatedUser.phone,
      agreeTerms: updatedUser.agreeTerms,
      practicingLicense: updatedUser.practicingLicense,
      doctorRegistrationNumber: updatedUser.doctorRegistrationNumber,
      isApproved: updatedUser.isApproved,
      loginTime: updatedUser.loginTime,
      isEmailVerified: updatedUser.isEmailVerified,
      otp: updatedUser.otp,
      otpExpires: updatedUser.otpExpires,
      resetPasswordToken: updatedUser.resetPasswordToken,
      resetPasswordExpires: updatedUser.resetPasswordExpires,
      isOnline: updatedUser.isOnline,
      specialistCategory: updatedUser.specialistCategory,
      profileImage: updatedUser.profileImage,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error("User not found or not a specialist");
  }
});

// Update specialist availability
const updateAvailability = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user && user.role === "specialist") {
      user.availability = req.body.availability;
      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        availability: updatedUser.availability,
      });
    } else {
      res.status(404);
      throw new Error("User not found or not a specialist");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get available specialist by category
const getAvailableSpecialist = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const activeThreshold = 5 * 60 * 1000; // 5 minutes in milliseconds

  const availableSpecialists = await User.find({
    role: "specialist",
    specialistCategory: category,
    isOnline: true,
    lastActiveTime: { $gte: new Date(Date.now() - activeThreshold) },
  })
    .sort({ lastActiveTime: -1 }) // Sort by last active time in descending order
    .select("-password")
    .limit(1); // Limit to 1 result

  if (availableSpecialists.length > 0) {
    res.json(availableSpecialists[0]);
  } else {
    res.status(404);
    throw new Error("No available specialist found for this category");
  }
});

module.exports = {
  registerAdmin,
  authAdmin,
  registerUser,
  verifyOTP,
  resendOTP,
  authUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  updateUserAvailability,
  updateAvailability,
  getAvailableSpecialist,
};
