const mongoose = require('mongoose');

const labReferralSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'VideoSession', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: true },
  lab: { type: mongoose.Schema.Types.ObjectId, ref: 'Laboratory', required: true },

  note: { type: String },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },

  fileUrl: { type: String, default: null },
  referredAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('LabReferral', labReferralSchema);
