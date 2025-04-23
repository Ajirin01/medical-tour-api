const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  cart: { type: mongoose.Schema.Types.ObjectId, ref: "Cart", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "UserModel", required: true },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "productType", // Dynamically decide the model based on this field
  },
  productType: {
    type: String,
    required: true,
    enum: ["Medication", "LabService"], // Limit the types of products
  },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  prescription: { type: mongoose.Schema.Types.ObjectId, ref: "Prescription", default: null },
  prescriptionLinkStatus: {
    type: String,
    enum: ["pending", "approved", "declined", "missing"],
    default: "missing",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Automatically update the `updatedAt` field before saving
cartItemSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("CartItem", cartItemSchema);

