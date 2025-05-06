const mongoose = require('mongoose');

const sessionFeedbackSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'VideoSession', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: true },
  feedbackText: { type: String },
  rating: { type: Number, min: 1, max: 5 },
}, { timestamps: true });

module.exports = mongoose.model("SessionFeedback", sessionFeedbackSchema);