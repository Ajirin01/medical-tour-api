const User = require("./User");
const mongoose = require('mongoose');

const LabAdmin = User.discriminator(
  "labAdmin",
  new mongoose.Schema({
    // laboratory: { type: mongoose.Schema.Types.ObjectId, ref: "Laboratory", required: true },
  }, { _id: false })
);

module.exports = LabAdmin;
