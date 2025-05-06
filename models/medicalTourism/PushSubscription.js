const mongoose = require('mongoose');

const PushSubscriptionSchema = new mongoose.Schema({
  endpoint: { type: String, required: true, unique: true },
  keys: {
    auth: { type: String, required: true },
    p256dh: { type: String, required: true },
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: false }, // optional
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('PushSubscription', PushSubscriptionSchema);
