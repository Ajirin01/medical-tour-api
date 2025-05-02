const { Server } = require("socket.io");

const onlineSpecialists = new Map();
const specialistsInCall = new Set();
const appointmentToCallSession = new Map();
const callTimeouts = new Map();

function setupConsultationSocket(io) {
  io.on("connection", (socket) => {
    console.log("✅ A user connected:", socket.id);

    socket.on("specialist-online", (specialist) => {
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
        io.emit("update-specialists", Array.from(onlineSpecialists.values()).map(v => v.data));
      }
    });

    socket.on("invite-specialist-to-call", ({ specialistId, appointmentId }) => {
      const room = `appointment_${appointmentId}`;

      if (specialistsInCall.has(specialistId)) {
        return socket.emit("specialist-busy", { appointmentId, specialistId });
      }

      const specialist = onlineSpecialists.get(specialistId);
      specialistsInCall.add(specialistId);

      appointmentToCallSession.set(appointmentId, {
        invitedSpecialistId: specialistId,
      });

      socket.join(room); // Patient joins room

      if (specialist) {
        specialist.socketIds.forEach(sockId => {
          io.to(sockId).socketsJoin(room); // All of specialist’s sockets join room
          io.to(sockId).emit("incoming-call", { appointmentId });
        });

        console.log(`📞 Invited specialist ${specialistId} to appointment ${appointmentId}`);

        const timeoutId = setTimeout(() => {
          console.log(`⌛ Call to specialist ${specialistId} for appointment ${appointmentId} timed out`);
          specialistsInCall.delete(specialistId);
          appointmentToCallSession.delete(appointmentId);
          callTimeouts.delete(appointmentId);
          io.to(room).emit("call-timeout", { appointmentId, specialistId });
        }, 30_000);

        callTimeouts.set(appointmentId, timeoutId);
      } else {
        appointmentToCallSession.delete(appointmentId);
        specialistsInCall.delete(specialistId);
        socket.emit("specialist-unavailable", { appointmentId, specialistId });
      }
    });

    socket.on("accept-call", ({ specialistId, appointmentId }) => {
      const room = `appointment_${appointmentId}`;
      const session = appointmentToCallSession.get(appointmentId);
      if (!session || session.invitedSpecialistId !== specialistId) return;

      const specialist = onlineSpecialists.get(specialistId);
      if (specialist) {
        onlineSpecialists.delete(specialistId);
        console.log(`✅ Specialist ${specialistId} accepted the call`);

        specialist.socketIds.forEach(sockId => {
          io.to(sockId).socketsJoin(room); // Join room
        });

        io.to(room).emit("call-accepted", { appointmentId, specialistId });
        io.emit("update-specialists", Array.from(onlineSpecialists.values()).map(v => v.data));
      }

      clearTimeout(callTimeouts.get(appointmentId));
      callTimeouts.delete(appointmentId);
      appointmentToCallSession.delete(appointmentId);
    });

    socket.on("reject-call", ({ specialistId, appointmentId }) => {
      const room = `appointment_${appointmentId}`;
      const session = appointmentToCallSession.get(appointmentId);
      if (!session || session.invitedSpecialistId !== specialistId) return;

      io.to(room).emit("call-rejected", { appointmentId, specialistId });

      specialistsInCall.delete(specialistId);
      clearTimeout(callTimeouts.get(appointmentId));
      callTimeouts.delete(appointmentId);
      appointmentToCallSession.delete(appointmentId);
      console.log(`❌ Specialist ${specialistId} rejected the call`);
    });

    socket.on("session-ended", ({ specialist, appointmentId }) => {
      const room = `appointment_${appointmentId}`;
      if (!specialist || !specialist._id) return;

      const existing = onlineSpecialists.get(specialist._id);
      if (existing) {
        existing.socketIds.add(socket.id);
      } else {
        onlineSpecialists.set(specialist._id, {
          data: specialist,
          socketIds: new Set([socket.id]),
        });
      }

      specialistsInCall.delete(specialist._id);
      console.log(`🔁 Session ended. Specialist ${specialist.firstName} is now available again`);

      io.to(room).emit("session-ended");
      io.emit("update-specialists", Array.from(onlineSpecialists.values()).map(v => v.data));
    });

    socket.on("get-online-specialists", () => {
      socket.emit("update-specialists", Array.from(onlineSpecialists.values()).map(v => v.data));
    });

    socket.on("joinNotificationRoom", (userId) => {
      socket.join(`notification_${userId}`);
    });

    socket.on("disconnect", () => {
      console.log("🔌 Disconnected:", socket.id);
      for (const [specialistId, info] of onlineSpecialists.entries()) {
        if (info.socketIds.has(socket.id)) {
          info.socketIds.delete(socket.id);

          if (info.socketIds.size === 0) {
            onlineSpecialists.delete(specialistId);
            specialistsInCall.delete(specialistId);
            console.log(`🔴 Specialist disconnected: ${info.data.firstName} (${specialistId})`);

            for (const [appointmentId, session] of appointmentToCallSession.entries()) {
              if (session.invitedSpecialistId === specialistId) {
                const room = `appointment_${appointmentId}`;
                clearTimeout(callTimeouts.get(appointmentId));
                callTimeouts.delete(appointmentId);
                appointmentToCallSession.delete(appointmentId);
                io.to(room).emit("specialist-disconnected", { appointmentId, specialistId });
              }
            }
          } else {
            console.log(`↪️ Partial disconnect for: ${info.data.firstName}`);
          }
          break;
        }
      }

      io.emit("update-specialists", Array.from(onlineSpecialists.values()).map(v => v.data));
    });
  });
}

module.exports = setupConsultationSocket;
