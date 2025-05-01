const { Server } = require("socket.io");

let io;

module.exports.init = (server) => {
  io = new Server(server, {
    cors: {
      origin: "https://sozodigicare.com",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  return io;
};

module.exports.getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
