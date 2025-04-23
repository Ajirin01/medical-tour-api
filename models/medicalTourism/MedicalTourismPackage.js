const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MedicalTourismPackageSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    location: { type: String, required: true },
    duration: { type: String, required: true },
    services: [{ type: String }],
    status: { type: String, enum: ['available', 'unavailable'], default: 'available' },
    photo: { type: String } // URL or path to package image
}, { timestamps: true });

module.exports = mongoose.model('MedicalTourismPackage', MedicalTourismPackageSchema);