const User = require("./User");
const mongoose = require("mongoose");

const SuperAdmin = User.discriminator(
  "superAdmin",
  new mongoose.Schema({}, { _id: false })
);

module.exports = SuperAdmin;
