const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MedicationSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    prescriptionRequired: { type: Boolean, default: false },
    pharmacy: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
    stock: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ['available', 'out of stock'], default: 'available' },
    photo: { type: String }, // URL or path to the medication image
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true }, // New field
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true } // New field
}, { timestamps: true });

module.exports = mongoose.model('Medication', MedicationSchema);
