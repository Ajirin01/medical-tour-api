const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  medication: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
}, { _id: false }); // prevent Mongoose from adding _id to each prescription subdoc

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

videoSessionSchema.set('toObject', { virtuals: true });
videoSessionSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model("VideoSession", videoSessionSchema);
