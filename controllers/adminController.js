const User = require("../models/User");

const getUsers = async (req, res) => {
  const {
    role,
    email,
    country,
    firstName,
    lastName,
    isApproved,
    isEmailVerified,
    startDate,
    endDate,
  } = req.query;
  const query = {};

  if (role) query.role = role;
  if (email) query.email = email;
  if (country) query.country = country;
  if (firstName) query.firstName = { $regex: firstName, $options: "i" };
  if (lastName) query.lastName = { $regex: lastName, $options: "i" };
  if (isApproved !== undefined) query.isApproved = isApproved === "true";
  if (isEmailVerified !== undefined)
    query.isEmailVerified = isEmailVerified === "true";

  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  try {
    const users = await User.find(query).sort({ createdAt: -1 });

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getUsers,
};
