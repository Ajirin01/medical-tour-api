// const GeneralController = require('./GeneralController');
const ConsultationAppointment = require('../../models/medicalTourism/ConsultationAppointment');
const Invoice = require('../../models/medicalTourism/Invoice');
const UserModel = require('../../models/medicalTourism/User');
const GeneralController = require('./GeneralController')
const Availability = require('../../models/medicalTourism/Availability');
const sendEmail = require("../../utils/medicalTourism/sendEmail");

const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");

class ConsultationAppointmentController extends GeneralController {
  constructor() {
      super(ConsultationAppointment);
  }

  async getOneWithUsers(req, res) {
      try {
          const { id } = req.params;
  
          const appointment = await ConsultationAppointment.findById(id)
              .populate("patient", "firstName lastName email")
              .populate("consultant", "firstName lastName email");
  
          if (!appointment) {
              return res.status(404).json({ message: "Appointment not found." });
          }
  
          res.status(200).json(appointment);
      } catch (error) {
          res.status(500).json({ message: error.message });
      }
  }

  async getPaginatedWithUsers(req, res) {
      try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
    
        const {
          patient,
          consultant,
          status,
          dateFrom,
          dateTo
        } = req.query;
    
        const filter = {};
    
        if (patient) filter.patient = patient;
        if (consultant) filter.consultant = consultant;
        if (status) filter.status = status;
    
        if (dateFrom || dateTo) {
          filter.date = {};
          if (dateFrom) filter.date.$gte = new Date(dateFrom);
          if (dateTo) {
            const endOfDay = new Date(dateTo);
            endOfDay.setHours(23, 59, 59, 999);
            filter.date.$lte = endOfDay;
          }
        }
    
        const [appointments, total] = await Promise.all([
          ConsultationAppointment.find(filter)
            .populate("patient", "firstName lastName email")
            .populate("consultant", "firstName lastName email specialty")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
          ConsultationAppointment.countDocuments(filter),
        ]);
    
        res.status(200).json({
          data: appointments,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          total,
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
  }

  async getNoPaginate(req, res) {
    try {
      const {
        patient,
        consultant,
        status,
        dateFrom,
        dateTo
      } = req.query;
  
      const filter = {};
  
      if (patient) filter.patient = patient;
      if (consultant) filter.consultant = consultant;
      if (status) filter.status = status;
  
      if (dateFrom || dateTo) {
        filter.date = {};
        if (dateFrom) filter.date.$gte = new Date(dateFrom);
        if (dateTo) {
          const endOfDay = new Date(dateTo);
          endOfDay.setHours(23, 59, 59, 999);
          filter.date.$lte = endOfDay;
        }
      }
  
      const [appointments, total] = await Promise.all([
        ConsultationAppointment.find(filter)
          .populate("patient", "firstName lastName email")
          .populate("consultant", "firstName lastName email specialty")
          .populate("slot")
          .sort({ createdAt: -1 }),
        ConsultationAppointment.countDocuments(filter),
      ]);
  
      res.status(200).json(appointments);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async createCustom(req, res) {
    try {
      const { patient, consultant, date, type, mode, slot } = req.body;
      const availabilityId = slot._id;
  
      // Validate consultant
      const consultantUser = await UserModel.findById(consultant);
      if (!consultantUser || consultantUser.role === 'patient') {
        return res.status(400).json({ message: "Invalid consultant." });
      }
  
      // Check if patient already has appointment with same consultant on that day
      const existingAppointment = await ConsultationAppointment.findOne({
        patient,
        consultant,
        date: {
          $gte: new Date(date).setHours(0, 0, 0, 0),
          $lte: new Date(date).setHours(23, 59, 59, 999),
        },
        status: { $in: ['pending', 'confirmed'] },
      });
  
      if (mode === "appointment") {
        const availabilitySlot = await Availability.findById(availabilityId);
  
        if (!availabilitySlot) {
          return res.status(400).json({ message: "Invalid availability slot." });
        }
  
        if (availabilitySlot.isBooked) {
          return res.status(400).json({ message: "This slot has already been booked." });
        }

        if (existingAppointment && existingAppointment.slot === availabilitySlot) {
          return res.status(400).json({
            message: "Appointment already exists",
            appointment: existingAppointment,
          });
        }
  
        if(slot.type !== "recurring"){
          // Mark as booked
          availabilitySlot.isBooked = true;
          await availabilitySlot.save();
        }
      }

      let appointmentData = req.body
      appointmentData = {...appointmentData, slot: availabilityId}
  
      // Create the appointment
      const newAppointment = await ConsultationAppointment.create(appointmentData);
  
      // Fetch patient user for email
      const patientUser = await UserModel.findById(patient);
  
      // Format date and time nicely
      const dayjs = require('dayjs');
      const formattedDate = dayjs(date).format("dddd, MMMM D, YYYY");
      const timeRange = `${slot.startTime} - ${slot.endTime}`;

      const templateSource = fs.readFileSync(
        path.join(__dirname, "../../templates/email-template.html"),
        "utf8"
      );
  
      // Email content
      const template = handlebars.compile(templateSource);

      const emailBody = `
        📅 Date: ${formattedDate}
        ⏰ Time: ${timeRange}
        💻 Mode: ${mode}

        🔗 Please check your dashboard for more details.
      `;

      let consultantHtml
      if(slot.category === "cert"){
        // Create consultant email content
        consultantHtml = template({
          subject: "New Appointment Booked",
          recipientName: consultantUser.firstName || "Consultant",
          bodyIntro: `A new appointment for medical certification has been scheduled with you.`,
          highlightText: `Patient: ${patientUser.firstName} ${patientUser.lastName || ""}`,
          bodyOutro: emailBody,
          year: new Date().getFullYear(),
        });
      }else{
        // Create consultant email content
        consultantHtml = template({
          subject: "New Appointment Booked",
          recipientName: consultantUser.firstName || "Consultant",
          bodyIntro: `A new appointment has been scheduled with you.`,
          highlightText: `Patient: ${patientUser.firstName} ${patientUser.lastName || ""}`,
          bodyOutro: emailBody,
          year: new Date().getFullYear(),
        });
      }

      // Create patient email content
      const patientHtml = template({
        subject: "Appointment Confirmation",
        recipientName: patientUser.firstName || "Patient",
        bodyIntro: `Your appointment has been successfully booked.`,
        highlightText: `Consultant: ${consultantUser.firstName} ${consultantUser.lastName || ""}`,
        bodyOutro: emailBody,
        year: new Date().getFullYear(),
      });

      // console.log(consultantHtml, patientHtml, consultantUser.email, patientUser.email)

      if (mode === "appointment") {
        // Send emails
        await sendEmail(
          consultantUser.email,
          "New Appointment Booked",
          consultantHtml,
        );
        await sendEmail(
          patientUser.email,
          "Appointment Confirmation",
          patientHtml,
        );
      }
  
      res.status(201).json({
        message: "Appointment booked successfully",
        appointment: newAppointment,
      });
    } catch (error) {
      console.error("Booking error:", error);
      res.status(500).json({ message: error.message });
    }
  }
    

  async updateCustom(req, res) {
      try {
          const { id } = req.params;
          const { status } = req.body;

          // Check if appointment exists
          const appointment = await ConsultationAppointment.findById(id);
          if (!appointment) {
              return res.status(404).json({ message: "Appointment not found." });
          }

          // If updating to completed, check if invoice is paid
          // if (status === 'completed') {
          //     // const invoice = await Invoice.findOne({ 
          //     //     user: appointment.patient, 
          //     //     purpose: "Consultation", 
          //     //     status: "paid" 
          //     // });

          //     if (!invoice) {
          //         return res.status(400).json({ message: "Cannot complete appointment until payment is made." });
          //     }
          // }

          // Update using generalized method
          const updatedAppointment = await ConsultationAppointment.findByIdAndUpdate(id, req.body, { new: true });

          res.status(200).json({ message: "Appointment updated successfully", appointment: updatedAppointment });
      } catch (error) {
          res.status(500).json({ message: error.message });
      }
  }

  async getAllSimple(req, res) {
      try {
        const appointments = await ConsultationAppointment.find({})
          .select("_id date patient duration")
          .populate("patient", "firstName lastName")
          .sort({ date: -1 });
    
        res.status(200).json({ data: appointments });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
  }
}

module.exports = {ConsultationAppointmentController: new ConsultationAppointmentController()};
