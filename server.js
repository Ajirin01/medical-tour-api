const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./config/db");
const app = require("./app");
const http = require("http");

const socket = require("./utils/socket"); // your socket.init
const setupConsultationSocket = require("./consultationSocket");

connectDB();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = socket.init(server);

setupConsultationSocket(io); // 🧠 All socket handling now in module

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
