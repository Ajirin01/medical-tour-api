const Appointment = require("../models/Appointment");
const { createNotification } = require("./notificationController");

const createAppointment = async (req, res) => {
  try {
    const { specialistId, dateTime, specialistCategory, notes, duration } = req.body;
    const patientId = req.user._id;

    const appointment = new Appointment({
      patient: patientId,
      specialist: specialistId,
      dateTime,
      specialistCategory,
      notes,
      duration
    });

    await appointment.save();

    await createNotification(patientId, {
      type: "appointment",
      content: `New appointment scheduled with ${specialistCategory} on ${dateTime}`,
      relatedId: appointment._id,
      onModel: "Appointment",
    });

    await createNotification(specialistId, {
      type: "appointment",
      content: `New appointment scheduled with a patient on ${dateTime}`,
      relatedId: appointment._id,
      onModel: "Appointment",
    });

    res.status(201).json(appointment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAppointments = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let query;
    if (userRole === "specialist") {
      query = { specialist: userId };
    } else {
      query = { patient: userId };
    }

    const appointments = await Appointment.find(query)
      .populate("patient", "firstName lastName")
      .populate("specialist", "firstName lastName specialistCategory")
      .sort({ dateTime: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, duration } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status, notes, duration },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json(appointment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const startAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const channelName = `appointment_${appointment._id}`;
    const token = generateAgoraToken(channelName);

    res.json({ channelName, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  updateAppointment,
  startAppointment,
};
