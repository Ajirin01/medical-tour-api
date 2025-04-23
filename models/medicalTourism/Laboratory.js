const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LaboratorySchema = new Schema({
    name: { type: String, required: true },
    license: { type: String, required: true, unique: true },
    labAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: true },
    employees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserModel' }],
    address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        country: { type: String }
    },
    contactNumber: { type: String, required: true },
    status: { type: String, enum: ['active', 'inactive', 'verified', 'unverified', 'rejected'], default: 'unverified' }
}, { timestamps: true });

module.exports = mongoose.model('Laboratory', LaboratorySchema);