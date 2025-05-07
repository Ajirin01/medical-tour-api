const mongoose = require("mongoose");
const User = require("./User");

const Specialist = User.discriminator(
  "specialist",
  new mongoose.Schema(
    {
      licenseNumber: { type: String, required: false },
      category: { type: String, required: false },
      approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      practicingLicense: { type: String },
      signature: { type: String },
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
