const User = require("./User");
const mongoose = require('mongoose');

const LabEmployee = User.discriminator(
  "labEmployee",
  new mongoose.Schema({
    laboratory: { type: mongoose.Schema.Types.ObjectId, ref: "Laboratory", required: true },
  }, { _id: false })
);

module.exports = LabEmployee;
