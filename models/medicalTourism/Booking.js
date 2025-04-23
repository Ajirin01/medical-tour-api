const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: true },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalTourismPackage', required: true },
    status: { type: String, enum: ['Pending', 'Confirmed', 'Canceled'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);