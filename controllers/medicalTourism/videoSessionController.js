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
      const allowedFields = ['startTime', 'endTime', 'durationInMinutes', 'specialistPaymentStatus', 'specialistPaymentDate', 'sessionNotes', 'videoCallUrl'];
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
  
}

module.exports = { VideoSessionController: new VideoSessionController() };
