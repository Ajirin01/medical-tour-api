const mongoose = require("mongoose");
const User = require("./User");

const UserDefault = User.discriminator(
  "user",
  new mongoose.Schema({
    isHealthQuestionsAnswered: {
      type: Boolean,
      default: false,
    },
  })
);

module.exports = UserDefault;
