const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./config/db");
const app = require("./app");
const http = require("http");
const socket = require("./utils/socket");

connectDB();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = socket.init(server);

// Store online specialists: { socketId => specialistData }
const onlineSpecialists = new Map();

io.on("connection", (socket) => {
  console.log("✅ A user connected:", socket.id);

  // For joining personal room (optional)
  socket.on("join", (userId) => {
    socket.join(userId);
  });

  // Specialist declares they are online
  socket.on("specialist-online", (specialist) => {
    if (specialist && specialist._id) {
      onlineSpecialists.set(socket.id, specialist);
      console.log(`🟢 Specialist online: ${specialist.firstName} (${specialist._id})`);

      io.emit("update-specialists", Array.from(onlineSpecialists.values()));
    }
  });

  // Client requests current online specialists
  socket.on("get-online-specialists", () => {
    socket.emit("update-specialists", Array.from(onlineSpecialists.values()));
  });

  // Leave notification room (optional)
  socket.on("joinNotificationRoom", (userId) => {
    socket.join(`notification_${userId}`);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    if (onlineSpecialists.has(socket.id)) {
      const removed = onlineSpecialists.get(socket.id);
      onlineSpecialists.delete(socket.id);
      console.log(`🔴 Specialist disconnected: ${removed?.name || 'Unknown'}`);

      io.emit("update-specialists", Array.from(onlineSpecialists.values()));
    } else {
      console.log("❌ User disconnected:", socket.id);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
