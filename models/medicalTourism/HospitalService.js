const mongoose = require('mongoose');

const hospitalServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: false,
  },
  category: {
    type: String,
    required: true,
    enum: ['General', 'Specialized', 'Surgical', 'Emergency', 'Diagnostic'],
    default: 'General',
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital', // Reference to the hospital providing this service
    required: true,
  },
  price: {
    type: Number,
    required: false,
  },
  availability: {
    type: Boolean,
    default: true,
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

hospitalServiceSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const HospitalService = mongoose.model('HospitalService', hospitalServiceSchema);

module.exports = HospitalService;
