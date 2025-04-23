const User = require("./User");
const mongoose = require("mongoose");

const Admin = User.discriminator(
  "admin",
  new mongoose.Schema({}, { _id: false })
);

module.exports = Admin;
