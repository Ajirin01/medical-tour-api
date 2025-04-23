const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserModel', // Reference to the UserModel model
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'NGN', // Change as needed
  },
  status: {
    type: String,
    enum: ['pending', 'successful', 'failed', 'cancelled'],
    default: 'pending',
  },
  reference: {
    type: String,
    unique: true,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'bank_transfer', 'crypto'],
    default: 'card',
  },
  transactionId: {
    type: String, // Assigned by the payment gateway (e.g., Flutterwave, Paystack, Stripe)
    unique: true,
    sparse: true,
  },
  metadata: {
    type: Object, // Store additional details (e.g., payer info, Flutterwave response)
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;

