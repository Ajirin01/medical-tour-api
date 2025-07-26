const cors = require("cors");

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://sozodigicare.com",
  "https://sozodigicare.com",
  "http://www.sozodigicare.com",
  "https://www.sozodigicare.com",
  "https://site.sozodigicare.com",
  "https://www.site.sozodigicare.com",
  "http://ireland.sozodigicare.com",
  "https://ireland.sozodigicare.com",
  "https://www.ireland.sozodigicare.com",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser clients
    if (allowedOrigins.includes(origin)) {
      return callback(null, origin);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Type", "Authorization"],
};

module.exports = cors(corsOptions);
