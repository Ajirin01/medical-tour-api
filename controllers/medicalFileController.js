const MedicalFile = require("../models/MedicalFile");
const User = require("../models/User");

exports.getMedicalFile = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    console.log("Getting medical file for patientId:", patientId);

    const patient = await User.findById(patientId);
    if (!patient) {
      console.log("Patient not found for patientId:", patientId);
      return res.status(404).json({ message: "Patient not found" });
    }

    let medicalFile = await MedicalFile.findOne({ patientId }).populate(
      "notes.specialistId prescriptions.specialistId",
      "firstName lastName specialistCategory"
    );

    console.log("Found medical file:", medicalFile);

    if (!medicalFile) {
      console.log("Creating new medical file for patientId:", patientId);
      medicalFile = new MedicalFile({
        patientId,
        notes: [],
        prescriptions: [],
      });
      await medicalFile.save();
    }

    const response = {
      patientInfo: {
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email,
        allergies: patient.allergies,
        medications: patient.medications,
        conditions: patient.conditions,
      },
      notes: medicalFile.notes,
      prescriptions: medicalFile.prescriptions,
    };

    console.log("Sending medical file response:", response);
    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching medical file:", error);
    res
      .status(500)
      .json({ message: "Error fetching medical file", error: error.message });
  }
};

exports.updateMedicalFile = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const { content, prescription } = req.body;
    const specialistId = req.user._id;

    console.log("Updating medical file for patientId:", patientId);
    console.log("Content:", content);
    console.log("Prescription:", prescription);
    console.log("SpecialistId:", specialistId);

    let medicalFile = await MedicalFile.findOne({ patientId });

    if (!medicalFile) {
      console.log("Medical file not found, creating new one");
      medicalFile = new MedicalFile({
        patientId,
        notes: [],
        prescriptions: [],
      });
    }

    if (content) {
      medicalFile.notes.push({ content, specialistId });
    }

    if (prescription) {
      medicalFile.prescriptions.push({ ...prescription, specialistId });
    }

    medicalFile.lastUpdated = Date.now();

    await medicalFile.save();

    // Fetch patient info
    const patient = await User.findById(patientId);

    const response = {
      patientInfo: {
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email,
        allergies: patient.allergies,
        medications: patient.medications,
        conditions: patient.conditions,
      },
      notes: medicalFile.notes,
      prescriptions: medicalFile.prescriptions,
    };

    console.log("Medical file updated successfully");
    res.status(200).json(response);
  } catch (error) {
    console.error("Error updating medical file:", error);
    res
      .status(500)
      .json({ message: "Error updating medical file", error: error.message });
  }
};

exports.getPrescriptions = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    console.log("Getting prescriptions for patientId:", patientId);

    const medicalFile = await MedicalFile.findOne({ patientId }).populate(
      "prescriptions.specialistId",
      "firstName lastName specialistCategory"
    );

    if (!medicalFile) {
      console.log("Medical file not found for patientId:", patientId);
      return res.status(404).json({ message: "Medical file not found" });
    }

    console.log("Sending prescriptions response");
    res.status(200).json({ prescriptions: medicalFile.prescriptions });
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    res
      .status(500)
      .json({ message: "Error fetching prescriptions", error: error.message });
  }
};
