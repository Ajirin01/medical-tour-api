const cors = require("cors");

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://sozodigicare.com",
    "https://sozodigicare.com",
    "https://site.sozodigicare.com",
    "http://www.sozodigicare.com",
    "https://www.sozodigicare.com",
    "https://www.site.sozodigicare.com"
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // Ensure credentials like cookies are allowed
};

module.exports = cors(corsOptions);
