const { Server } = require("socket.io");
const webpush = require("web-push");

// const { generateAgoraToken } = require("./utils/agora");

webpush.setVapidDetails(
    "mailto:mubarakolagoke@gmail.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  

const onlineSpecialists = new Map();
const specialistsInCall = new Set();
const appointmentToCallSession = new Map();
const callTimeouts = new Map();

// Temporary in-memory store (replace with database in production)
const pushSubscriptions = new Map(); // key = userId, value = subscription object

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
          io.to(sockId).socketsJoin(room);
          io.to(sockId).emit("incoming-call", { appointmentId });
        });
      
        console.log(`📞 Invited specialist ${specialistId} to appointment ${appointmentId}`);
      
        // ✅ Send web push notification here
        const pushSub = pushSubscriptions.get(specialistId);
        if (pushSub) {
          const notificationPayload = JSON.stringify({
            title: "Incoming Consultation Call",
            body: "You have an incoming call for a consultation appointment.",
            icon: "/icons/notification-icon.png", // Customize if needed
            data: {
              appointmentId,
              url: `/consultation/${appointmentId}`
            }
          });
      
          webpush.sendNotification(pushSub, notificationPayload).catch(error => {
            console.error("Web push error:", error.message);
          });
        }
      
        const timeoutId = setTimeout(() => {
          console.log(`⌛ Call to specialist ${specialistId} for appointment ${appointmentId} timed out`);
          specialistsInCall.delete(specialistId);
          appointmentToCallSession.delete(appointmentId);
          callTimeouts.delete(appointmentId);
          io.to(room).emit("call-timeout", { appointmentId, specialistId });
        }, 30_000);
      
        callTimeouts.set(appointmentId, timeoutId);
      }else {
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
    
        // Generate the token for both specialist and patient (userId assumed to be in the session)
        const patientId = session.patientId; // You should have the patientId in the session
        // const specialistToken = generateAgoraToken(room); // Generate token for specialist
        // const patientToken = generateAgoraToken(room); // Generate token for patient
    
        specialist.socketIds.forEach(sockId => {
          io.to(sockId).socketsJoin(room); // Join room
        });
    
        // Emit the call-accepted event with tokens for both the specialist and the patient
        io.to(room).emit("call-accepted", {
          appointmentId,
          specialistId
        });
    
        io.emit("update-specialists", Array.from(onlineSpecialists.values()).map(v => v.data));
      }
    
      clearTimeout(callTimeouts.get(appointmentId));
      callTimeouts.delete(appointmentId);
      appointmentToCallSession.delete(appointmentId);
    });

    // socket.on("accept-call", ({ specialistId, appointmentId }) => {
    //   const room = `appointment_${appointmentId}`;
    //   const session = appointmentToCallSession.get(appointmentId);
    //   if (!session || session.invitedSpecialistId !== specialistId) return;

    //   const specialist = onlineSpecialists.get(specialistId);
    //   if (specialist) {
    //     onlineSpecialists.delete(specialistId);
    //     console.log(`✅ Specialist ${specialistId} accepted the call`);

    //     specialist.socketIds.forEach(sockId => {
    //       io.to(sockId).socketsJoin(room); // Join room
    //     });

    //     io.to(room).emit("call-accepted", { appointmentId, specialistId });
    //     io.emit("update-specialists", Array.from(onlineSpecialists.values()).map(v => v.data));
    //   }

    //   clearTimeout(callTimeouts.get(appointmentId));
    //   callTimeouts.delete(appointmentId);
    //   appointmentToCallSession.delete(appointmentId);
    // });

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

    socket.on("session-created", ({ appointmentId, session, specialistToken, patientToken }) => {
      console.log("📦 Received session-created for:", appointmentId, session._id, specialistToken, patientToken);
      io.to(`appointment_${appointmentId}`).emit("session-created", { appointmentId, session, specialistToken, patientToken });
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
      console.log(`🔁 Session ${appointmentId} ended. Specialist ${specialist.firstName} is now available again`);

      io.emit("session-ended", { specialist, appointmentId });
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
