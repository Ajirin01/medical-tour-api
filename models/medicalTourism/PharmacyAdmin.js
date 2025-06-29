const User = require("./User");
const mongoose = require('mongoose');

const PharmacyAdmin = User.discriminator(
  "pharmacyAdmin",
  new mongoose.Schema({
    // pharmacy: { type: mongoose.Schema.Types.ObjectId, ref: "Pharmacy", required: true },
  }, { _id: false })
);

module.exports = PharmacyAdmin;
