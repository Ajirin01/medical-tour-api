const User = require("./User");

const LabEmployee = User.discriminator(
  "labEmployee",
  new mongoose.Schema({
    laboratory: { type: mongoose.Schema.Types.ObjectId, ref: "Laboratory", required: true },
  }, { _id: false })
);

module.exports = LabEmployee;
