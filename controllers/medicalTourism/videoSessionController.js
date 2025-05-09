const VideoSession = require('../../models/medicalTourism/VideoSession');
const SessionFeedback = require('../../models/medicalTourism/SessionFeedback');

class VideoSessionController {
  constructor() {
    this.createSession = this.createSession.bind(this);
    this.getSessionByAppointment = this.getSessionByAppointment.bind(this);
    this.addFeedback = this.addFeedback.bind(this);
    this.getFeedbackBySession = this.getFeedbackBySession.bind(this);
    this.getUserSessions = this.getUserSessions.bind(this);
    this.getSessionById = this.getSessionById.bind(this);
    this.updateSession = this.updateSession.bind(this);
  }

  handleError(res, message, status = 500) {
    res.status(status).json({ success: false, message });
  }

  async createSession(req, res) {
    try {
      const session = await VideoSession.create(req.body);
  
      // Populate related fields to include in the emitted payload
      await session.populate('user specialist appointment');
  
      const payload = {
        ...session.toObject(),
      };
  
      res.status(201).json({ success: true, session: payload });
    } catch (error) {
      console.error('Create session error:', error);
      this.handleError(res, error.message, 400);
    }
  }
  
  async updateSession(req, res) {
    try {
      const { id } = req.params;
      const updateFields = req.body;
  
      // Validate: only allow updating specific fields
      const allowedFields = ['startTime', 'endTime', 'durationInMinutes', 'specialistPaymentStatus', 'specialistPaymentDate', 'sessionNotes', 'videoCallUrl', 'prescriptions'];
      const sanitizedUpdate = {};
  
      for (const key of allowedFields) {
        if (key in updateFields) sanitizedUpdate[key] = updateFields[key];
      }
  
      const session = await VideoSession.findOneAndUpdate(
        { _id: id },
        sanitizedUpdate,
        { new: true }
      );
  
      if (!session) {
        return this.handleError(res, 'Session not found', 404);
      }
  
      res.status(200).json({ success: true, session });
    } catch (error) {
      console.error('Update session error:', error);
      this.handleError(res, 'Failed to update session');
    }
  }

  async getSessionByAppointment(req, res) {
    try {
      const session = await VideoSession.findOne({ appointment: req.params.appointmentId })
        .populate('user specialistId');
      if (!session) {
        return this.handleError(res, 'Session not found', 404);
      }
      res.status(200).json({ success: true, session });
    } catch (error) {
      console.error('Get session error:', error);
      this.handleError(res, 'Failed to fetch session');
    }
  }

  async getSessionById(req, res) {
    try {
      const session = await VideoSession.findOne({ _id: req.params.id })
      .populate('user specialist appointment')
      .populate('feedback');
    
      if (!session) {
        return this.handleError(res, 'Session not found', 404);
      }
      res.status(200).json({ success: true, session });
    } catch (error) {
      console.error('Get session error:', error);
      this.handleError(res, 'Failed to fetch session');
    }
  }

  async addFeedback(req, res) {
    try {
      const feedback = await SessionFeedback.create(req.body);
      res.status(201).json({ success: true, feedback });
    } catch (error) {
      console.error('Add feedback error:', error);
      this.handleError(res, error.message, 400);
    }
  }

  async getFeedbackBySession(req, res) {
    try {
      const feedback = await SessionFeedback.findOne({ session: req.params.sessionId });
      if (!feedback) {
        return this.handleError(res, 'Feedback not found', 404);
      }
      res.status(200).json({ success: true, feedback });
    } catch (error) {
      console.error('Get feedback error:', error);
      this.handleError(res, 'Failed to fetch feedback');
    }
  }

  async getUserSessions(req, res) {
    try {
      const sessions = await VideoSession.find({ user: req.params.userId })
        .populate('specialist appointment');
      res.status(200).json({ success: true, sessions });
    } catch (error) {
      console.error('Get user sessions error:', error);
      this.handleError(res, 'Failed to fetch user sessions');
    }
  }

  async getAllPrescriptions(req, res) {
    try {
      const sessions = await VideoSession.find({ prescriptions: { $exists: true, $not: { $size: 0 } } })
        .populate('user specialist appointment')
        .sort({ createdAt: -1 });
  
      const prescriptions = sessions.flatMap(session => 
        session.prescriptions.map(prescription => ({
          ...prescription.toObject(),
          sessionId: session._id,
          createdAt: session.createdAt,
          user: session.user,
          specialist: session.specialist,
          appointment: session.appointment,
        }))
      );
  
      res.status(200).json({ success: true, prescriptions });
    } catch (error) {
      console.error("Error fetching all prescriptions:", error);
      this.handleError(res, "Failed to fetch prescriptions");
    }
  }

  // Get prescriptions by session ID
  async getPrescriptionsBySession(req, res) {
    try {
      const session = await VideoSession.findById(req.params.sessionId);
      if (!session) return this.handleError(res, 'Session not found', 404);
      res.status(200).json({ success: true, prescriptions: session.prescriptions });
    } catch (error) {
      console.error('Error fetching prescriptions by session:', error);
      this.handleError(res, 'Failed to fetch prescriptions');
    }
  }

  // Get prescriptions by user ID
  async getPrescriptionsByUser(req, res) {
    try {
      const sessions = await VideoSession.find({
        user: req.params.userId,
        prescriptions: { $exists: true, $not: { $size: 0 } },
      })
        .populate('user specialist appointment')
        .sort({ createdAt: -1 });
  
      res.status(200).json({ success: true, sessions });
    } catch (error) {
      console.error('Error fetching prescriptions by user:', error);
      this.handleError(res, 'Failed to fetch prescriptions');
    }
  }
  

  // Get prescriptions by specialist ID
  async getPrescriptionsBySpecialist(req, res) {
    try {
      const sessions = await VideoSession.find({
        specialist: req.params.specialistId,
        prescriptions: { $exists: true, $not: { $size: 0 } },
      })
        .populate('user specialist appointment')
        .sort({ createdAt: -1 });
  
      res.status(200).json({ success: true, sessions });
    } catch (error) {
      console.error('Error fetching prescriptions by specialist:', error);
      this.handleError(res, 'Failed to fetch prescriptions');
    }
  }

  async getPaginatedSessions(req, res) {
    const { page = 1, limit = 10 } = req.query;
    const role = req.user.role;
    const userId = req.user.id;
  
    let filter = {};
  
    if (role === "user") {
      filter.user = userId;
    } else if (role === "specialist") {
      filter.specialist = userId;
    }
    // Admins see everything — no filter applied
  
    try {
      const sessions = await VideoSession.find(filter)
        .populate("user")
        .populate("specialist")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));
  
      const total = await VideoSession.countDocuments(filter);
  
      res.json({
        data: sessions,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error("Error fetching video sessions:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  async getPaginatedFeedbacks(req, res) {
    const { page = 1, limit = 10, rating, startDate, endDate } = req.query;
  
    let filter = {};
  
    if (rating) {
      filter.rating = Number(rating);
    }
  
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }
  
    try {
      const feedbacks = await SessionFeedback.find(filter)
        .populate({
          path: 'session',
          populate: [
            { path: 'user', model: 'UserModel' },
            { path: 'specialist', model: 'UserModel' },
            { path: 'appointment' }
          ]
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));
  
      const total = await SessionFeedback.countDocuments(filter);
  
      res.json({
        data: feedbacks,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
  
}

module.exports = { VideoSessionController: new VideoSessionController() };
