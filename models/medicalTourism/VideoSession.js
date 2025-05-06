const mongoose = require('mongoose');

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
