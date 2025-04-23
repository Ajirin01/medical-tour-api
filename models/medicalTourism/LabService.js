const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LabServiceSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    laboratory: { type: mongoose.Schema.Types.ObjectId, ref: 'Laboratory', required: true },
    status: { type: String, enum: ['available', 'unavailable'], default: 'available' },
    prescriptionRequired: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('LabService', LabServiceSchema);