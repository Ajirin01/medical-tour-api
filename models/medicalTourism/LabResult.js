const mongoose = require('mongoose');

const labResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserModel', // Reference to the UserModel model
    required: true,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true, // Always tied to an order
  },
  resultFile: {
    type: String, // Path to the uploaded lab result file (PDF, Image, etc.)
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'reviewed'],
    default: 'pending',
  },
  comments: {
    type: String, // Optional doctor/lab technician comments
    default: '',
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserModel', // Reference to admin/lab technician uploading the result
    required: true,
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

labResultSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const LabResult = mongoose.model('LabResult', labResultSchema);

module.exports = LabResult;
