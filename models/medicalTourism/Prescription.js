const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "UserModel", required: true },
    fileUrl: { type: String, required: true }, // URL/path to prescription file
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    associatedCartItems: [{ type: mongoose.Schema.Types.ObjectId, ref: "CartItem" }], // Links to cart items
    expiresAt: { type: Date }, // Expiry after 30 days from order completion
  },
  { timestamps: true }
);

// Auto-delete prescription 30 days after order completion
prescriptionSchema.pre("save", function (next) {
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model("Prescription", prescriptionSchema);
