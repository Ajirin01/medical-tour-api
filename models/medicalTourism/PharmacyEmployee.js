const User = require("./User");

const PharmacyEmployee = User.discriminator(
  "pharmacyEmployee",
  new mongoose.Schema({
    pharmacy: { type: mongoose.Schema.Types.ObjectId, ref: "Pharmacy", required: true },
  }, { _id: false })
);

module.exports = PharmacyEmployee;
