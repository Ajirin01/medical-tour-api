const GeneralController = require('./GeneralController');
const Availability = require('../../models/medicalTourism/Availability');

class AvailabilityController extends GeneralController {
  constructor() {
    super(Availability);
  }

  // Get all availability slots for a specific user
  async getByUser(req, res) {
    try {
      const { userId } = req.params;
      const results = await Availability.find({ user: userId }).sort({ createdAt: -1 });
      res.status(200).json(results);
    } catch (error) {
      console.error('Error fetching availability by user:', error);
      res.status(500).json({ message: 'Failed to fetch availability for user' });
    }
  }

   async getByRole(req, res) {
    try {
      const { userRole, consultantId } = req.query
  
      if (!userRole) {
        return res.status(400).json({ message: 'userRole query param is required' })
      }
  
      const availabilities = await Availability.find()
        .populate({
          path: 'user',
          match: { role: userRole}, // Filter only users with the role
          select: 'role firstName lastName email', // Optional: only pull what you need
        })

        

      // Remove any availability where `user` was not matched (i.e., not the specified role)
      const filtered = availabilities.filter(a => a.user?._id.toString() === consultantId)

      console.log(filtered)
  
      res.json({ data: filtered })
    } catch (err) {
      console.error('Failed to fetch availabilities by role:', err)
      res.status(500).json({ message: 'Server error' })
    }
  }
  

  // Custom create method to avoid time overlaps for the same user
  async createCustom(req, res) {
    try {
      const data = req.body;

      if (!data.user) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      // Optional: Prevent overlap logic for same user, date/day and time range
      const query = {
        user: data.user,
        type: data.type || 'recurring',
      };

      if (data.type === 'recurring' && data.dayOfWeek) {
        query.dayOfWeek = data.dayOfWeek;
      } else if (data.type === 'one-time' && data.date) {
        query.date = data.date;
      }

      const overlaps = await Availability.find(query);
      const isOverlapping = overlaps.some(slot =>
        (data.startTime < slot.endTime && data.endTime > slot.startTime)
      );

      if (isOverlapping) {
        return res.status(409).json({ message: 'Time slot overlaps with an existing availability' });
      }

      const newSlot = new Availability(data);
      const result = await newSlot.save();
      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating availability:', error);
      res.status(500).json({ message: 'Failed to create availability slot' });
    }
  }
}

module.exports = {
  AvailabilityController: new AvailabilityController(),
};
