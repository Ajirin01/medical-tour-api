const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: true },
  placedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel' },

  category: {
    type: String,
    enum: ['Medication', 'LabService'],
    required: true,
  },

  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'category',
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
    }
  }],

  totalAmount: { type: Number, required: true },

  status: {
    type: String,
    enum: ['pending', 'paid', 'shipped', 'completed', 'cancelled'],
    default: 'pending',
  },

  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },

  paymentReference: { type: String },

  // 👇 New field for shipping address (optional)
  shippingAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShippingAddress',
    default: null,
  },

}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
