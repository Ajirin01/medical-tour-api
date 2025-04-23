const User = require("./User");

const LabEmployee = User.discriminator(
  "labEmployee",
  new mongoose.Schema({
    pharmacy: { type: mongoose.Schema.Types.ObjectId, ref: "Laboratory", required: true },
  }, { _id: false })
);

module.exports = LabEmployee;
