const mongoose = require("mongoose");
const User = require("./User");

const consultantUserSchema = new mongoose.Schema({
  bio: { type: String },
  languagesSpoken: [String],
  regionFocus: { type: String }, // e.g., "Southeast Asia", "Middle East", etc.
  expertiseArea: { type: String }, // e.g., "Cancer Treatment Planning", "Dental Tourism"
}, { _id: false });

const ConsultantUser = User.discriminator("ConsultantUser", consultantUserSchema);

module.exports = ConsultantUser;
