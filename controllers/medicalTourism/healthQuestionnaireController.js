const GeneralController = require('./GeneralController');
const HealthQuestionnaire = require('../../models/medicalTourism/HealthQuestionnaire');
const User = require("../../models/medicalTourism/User");
const UserDefault = require("../../models/medicalTourism/UserDefault");


class HealthQuestionnaireController extends GeneralController {
  constructor() {
    super(HealthQuestionnaire);
  }

  // Optionally: Custom method to get all questionnaires for a specific user
  async getByUser(req, res) {
    try {
      const { userId } = req.params;
      const results = await HealthQuestionnaire.find({ user: userId });
      res.status(200).json(results);
    } catch (error) {
      console.error('Error fetching user questionnaires:', error);
      res.status(500).json({ message: 'Failed to fetch questionnaires for user' });
    }
  }

  async createCustom(req, res) {
    try {
      const data = req.body;

      if (!data.user) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const existing = await HealthQuestionnaire.findOne({ user: data.user });

      let result;
      if (existing) {
        // Update existing questionnaire
        Object.assign(existing, data);
        result = await existing.save();
      } else {
        // Create new questionnaire
        const newDoc = new HealthQuestionnaire(data);
        result = await newDoc.save();
      }

      // Update the user's isHealthQuestionsAnswered flag
      await UserDefault.findByIdAndUpdate(data.user, { isHealthQuestionsAnswered: true });

      res.status(200).json(result);
    } catch (error) {
      console.error('Error creating/updating health questionnaire:', error);
      res.status(500).json({ message: 'Failed to create or update health questionnaire' });
    }
  }
}

module.exports = {
  HealthQuestionnaireController: new HealthQuestionnaireController(),
};
