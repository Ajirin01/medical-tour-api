const mongoose = require('mongoose');

// ✅ Prescription Subschema
const prescriptionSchema = new mongoose.Schema({
  medication: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
}, { _id: false });

// ✅ Lab Referral Subschema
const labReferralSchema = new mongoose.Schema({
  testName: { type: String, required: true },
  labName: { type: String }, // optional: where the test should be done
  note: { type: String }, // optional: doctor’s note or instruction
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  referralDate: { type: Date, default: Date.now }
}, { _id: false });

// ✅ Main Video Session Schema
const videoSessionSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConsultationAppointment',
    required: true,
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: true },
  specialist: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: true },
  startTime: { type: Date },
  endTime: { type: Date },
  durationInMinutes: { type: Number },
  videoCallUrl: { type: String },
  sessionNotes: { type: String },

  prescriptions: [prescriptionSchema],
  labReferrals: [labReferralSchema], // ✅ Add lab referrals here

  specialistPaymentStatus: {
    type: String,
    enum: ['unpaid', 'pending', 'paid'],
    default: 'unpaid',
  },
  specialistPaymentDate: { type: Date, default: null },
}, { timestamps: true });

// 🔗 Virtual for feedback population
videoSessionSchema.virtual('feedback', {
  ref: 'SessionFeedback',
  localField: '_id',
  foreignField: 'session',
  justOne: true,
});

// ✅ Enable virtuals in JSON and object output
videoSessionSchema.set('toObject', { virtuals: true });
videoSessionSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model("VideoSession", videoSessionSchema);
