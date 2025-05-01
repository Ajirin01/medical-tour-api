const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./config/db");
const app = require("./app");
const http = require("http");
const socket = require("./utils/socket");

connectDB();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://sozodigicare.com",
    methods: ["GET", "POST"],
    credentials: true,
  }
});

// Track online specialists: { specialistId => { data, socketIds: Set } }
const onlineSpecialists = new Map();
const appointmentToUserSocket = new Map();

io.on("connection", (socket) => {
  console.log("✅ A user connected:", socket.id);

  // When a specialist comes online
  socket.on("specialist-online", (specialist) => {
    console.log(specialist)

    if (specialist && specialist._id) {
      const existing = onlineSpecialists.get(specialist._id);

      if (existing) {
        existing.socketIds.add(socket.id);
      } else {
        onlineSpecialists.set(specialist._id, {
          data: specialist,
          socketIds: new Set([socket.id]),
        });
      }

      console.log(`🟢 Specialist online: ${specialist.firstName} (${specialist._id})`);

      // Emit to all clients
      io.emit("update-specialists", Array.from(onlineSpecialists.values()).map(v => v.data));
    }
  });

  socket.on("invite-specialist-to-call", ({ specialistId, appointmentId }) => {
    const specialist = onlineSpecialists.get(specialistId);
  
    // Save who initiated this call
    appointmentToUserSocket.set(appointmentId, socket.id);
  
    if (specialist) {
      specialist.socketIds.forEach((sockId) => {
        io.to(sockId).emit("incoming-call", { appointmentId });
      });
      console.log(`📞 Invited specialist ${specialistId} to appointment ${appointmentId}`);
    } else {
      console.log(`❌ Specialist ${specialistId} is not online`);
    }
  });
  
// specialist accepts call
  socket.on("accept-call", ({ specialistId, appointmentId }) => {
    const specialist = onlineSpecialists.get(specialistId);
    if (specialist) {
      onlineSpecialists.delete(specialistId);
      io.emit("update-specialists", Array.from(onlineSpecialists.values()).map(v => v.data));
      console.log(`✅ Specialist ${specialistId} accepted the call and is now in session`);
  
      // Clean up tracking
      appointmentToUserSocket.delete(appointmentId);
    }
  });

// reject request
  socket.on("reject-call", ({ specialistId, appointmentId }) => {
    const userSocketId = appointmentToUserSocket.get(appointmentId);
  
    if (userSocketId) {
      io.to(userSocketId).emit("call-rejected", { appointmentId, specialistId });
      
      console.log("Specialist rejected call")
  
      // Optionally clean up
      appointmentToUserSocket.delete(appointmentId);
    }
  });

  // When a patient wants to get the current list
  socket.on("get-online-specialists", () => {
    socket.emit("update-specialists", Array.from(onlineSpecialists.values()).map(v => v.data));
  });

  // Optional: for future notification rooms
  socket.on("joinNotificationRoom", (userId) => {
    socket.join(`notification_${userId}`);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    for (const [specialistId, info] of onlineSpecialists.entries()) {
      if (info.socketIds.has(socket.id)) {
        info.socketIds.delete(socket.id);

        if (info.socketIds.size === 0) {
          onlineSpecialists.delete(specialistId);
          console.log(`🔴 Specialist disconnected: ${info.data.firstName} (${specialistId})`);
        } else {
          console.log(`↪️ Partial disconnect for: ${info.data.firstName}`);
        }

        break; // No need to check further
      }
    }

    // Broadcast updated list
    io.emit("update-specialists", Array.from(onlineSpecialists.values()).map(v => v.data));
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
