const mongoose = require('mongoose');

const ConsultationAppointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: true },
  consultant: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: true },
  date: { type: Date, required: true },
  duration: { type: Number, required: true }, // Duration in minutes
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled', 'ongoing'], default: 'pending' },
  type: { type: String, enum: ['general', 'medicalTourism'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('ConsultationAppointment', ConsultationAppointmentSchema);
