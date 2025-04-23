const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InvoiceSchema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: true },
    purpose: { type: String, enum: ['Consultation', 'Lab Service', 'Medical Tourism'], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', InvoiceSchema);