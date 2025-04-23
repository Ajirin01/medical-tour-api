const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BrandSchema = new Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    logo: { type: String } // URL or path to the brand logo
}, { timestamps: true });

module.exports = mongoose.model('Brand', BrandSchema);
