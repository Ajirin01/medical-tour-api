const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: { type: String, required: false },
    coordinates: {
      lat: { type: Number, required: false }, // Latitude
      lng: { type: Number, required: false }, // Longitude
    },
  },
  contact: {
    phone: { type: String, required: true },
    email: { type: String, required: false },
    website: { type: String, required: false },
  },
  services: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HospitalService', // Updated to reference HospitalService model
    },
  ],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0, // Default rating, can be updated later
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  operatingHours: {
    open: { type: String, required: false }, // Example: "08:00 AM"
    close: { type: String, required: false }, // Example: "08:00 PM"
  },
  accreditation: {
    type: String,
    required: false, // Accreditation body or certificate name
  },
  emergencyServices: {
    type: Boolean,
    default: false, // Indicates if the hospital provides emergency services
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

hospitalSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Hospital = mongoose.model('Hospital', hospitalSchema);

module.exports = Hospital;
