const mongoose = require("mongoose");

// Note Schema
const noteSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  specialistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    required: true,
  },
});

// Prescription Schema
const prescriptionSchema = new mongoose.Schema({
  medication: {
    type: String,
    required: true,
  },
  dosage: {
    type: String,
    required: true,
  },
  frequency: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  specialistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

// MedicalFile Schema
const medicalFileSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    required: true,
  },
  notes: [noteSchema],  // Embedded notes
  prescriptions: [prescriptionSchema],  // Embedded prescriptions
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

const MedicalFile = mongoose.model("MedicalFile", medicalFileSchema);
module.exports = MedicalFile;
