const mongoose = require('mongoose');

const ConsultationDocumentationSchema = new mongoose.Schema({
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'ConsultationAppointment', required: true },
    notes: { type: String, required: true },
    documents: [{ type: String }] // URLs or paths to additional documentation
}, { timestamps: true });

module.exports = mongoose.model('ConsultationDocumentation', ConsultationDocumentationSchema);