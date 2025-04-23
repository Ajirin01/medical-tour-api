const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const options = { discriminatorKey: "role", timestamps: true };

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    phone: { type: String, required: false },
    address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        country: { type: String }
    },
    isEmailVerified: { type: Boolean, default: false },
    profileImage: { type: String },

    loginTime: { type: Date, default: Date.now },
    otp: { type: String },
    otpExpires: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    isOnline: { type: Boolean, default: false },
  },
  options
);

const User = mongoose.model("UserModel", userSchema);
module.exports = User;
