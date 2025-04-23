const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "specialist", "admin", "pharmacyAdmin", "labAdmin", "pharmacyEmployee", "labEmployee", "consultant"],
      required: true,
    },
    isQuestionsAnswered: { type: Boolean, default: false },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    adminPassword: { type: String, default: null },
    dateOfBirth: { type: Date },
    gender: { type: String },
    address: { type: String },
    country: { type: String },
    phone: { type: String },
    agreeTerms: { type: Boolean, default: false },
    practicingLicense: { type: String },
    doctorRegistrationNumber: { type: String },
    isApproved: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    loginTime: { type: Date, default: Date.now },
    otp: { type: String },
    otpExpires: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    isOnline: { type: Boolean, default: false },
    profileImage: { type: String },
    specialistCategory: { type: String },
    availability: [
      {
        day: {
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
        startTime: String,
        endTime: String,
      },
    ],
    lastActiveTime: { type: Date, default: Date.now },

    address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        country: { type: String }
    },
    pharmacy: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: function() { return this.role === 'pharmacyUser'; } },
    laboratory: { type: mongoose.Schema.Types.ObjectId, ref: 'Laboratory', required: function() { return this.role === 'labUser'; } },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") && !this.isModified("adminPassword")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  if (this.adminPassword) {
    this.adminPassword = await bcrypt.hash(this.adminPassword, salt);
  }
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.matchAdminPassword = async function (enteredAdminPassword) {
  return await bcrypt.compare(enteredAdminPassword, this.adminPassword);
};

// Generate OTP
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = otp;
  this.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return otp;
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
