// const GeneralController = require('./GeneralController');
const ConsultationAppointment = require('../../models/medicalTourism/ConsultationAppointment');
const Invoice = require('../../models/medicalTourism/Invoice');
const UserModel = require('../../models/medicalTourism/User');
const GeneralController = require('./GeneralController')
const Availability = require('../../models/medicalTourism/Availability');

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

    async createCustom(req, res) {
      try {
        const { patient, consultant, date, type, mode, startTime, endTime } = req.body;
    
        // Validate consultant exists and is not a patient
        const consultantUser = await UserModel.findById(consultant);
        if (!consultantUser || consultantUser.role === 'patient') {
          return res.status(400).json({ message: "Invalid consultant." });
        }
    
        // Check for existing appointment (same patient, consultant, date, pending/confirmed)
        const existingAppointment = await ConsultationAppointment.findOne({
          patient,
          consultant,
          date: {
            $gte: new Date(date).setHours(0, 0, 0, 0),
            $lte: new Date(date).setHours(23, 59, 59, 999),
          },
          status: { $in: ['pending', 'confirmed'] },
        });
    
        if (existingAppointment) {
          return res.status(200).json({
            message: "Appointment already exists",
            appointment: existingAppointment,
          });
        }
    
        if (mode === "appointment") {
          // Find the availability slot to book (matching user, date, startTime, endTime, and not booked)
          const availabilitySlot = await Availability.findOne({
            user: consultant,
            date: new Date(date),
            startTime,
            endTime,
            isBooked: false,
          });
    
          if (!availabilitySlot) {
            return res.status(400).json({ message: "No available slot found for this time." });
          }
    
          // Mark availability as booked
          availabilitySlot.isBooked = true;
          await availabilitySlot.save();
        }
    
        // Create new appointment
        const newAppointment = await ConsultationAppointment.create(req.body);
    
        res.status(201).json({
          message: "Appointment booked successfully",
          appointment: newAppointment,
        });
      } catch (error) {
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
