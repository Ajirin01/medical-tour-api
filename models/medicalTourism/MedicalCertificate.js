const mongoose = require('mongoose');

const MedicalCertificateSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserModel',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserModel',
    required: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  diagnosis: {
    type: String,
    required: true
  },
  comment: {
    type: String,
    required: true
  },
  certID: {
    type: String,
    required: true,
    unique: true
  },
  qrCodeUrl: {
    type: String // Optional field if you store QR image URL
  }
}, { timestamps: true });

module.exports = mongoose.model('MedicalCertificate', MedicalCertificateSchema);
