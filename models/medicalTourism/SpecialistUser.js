const mongoose = require("mongoose");
const User = require("./User");

const Specialist = User.discriminator(
  "specialist",
  new mongoose.Schema(
    {
      licenseNumber: { type: String, required: false },
      category: { type: String, required: false },
      isApproved: { type: Boolean, default: false },
      practicingLicense: { type: String },
      // Consultant-like fields
      specialty: { type: String },
      bio: { type: String },
      experience: { type: Number }, // in years
      languages: [{ type: String }]
    },
    { _id: false }
  )
);

module.exports = Specialist;
