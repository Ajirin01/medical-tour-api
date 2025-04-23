const GeneralController = require('./GeneralController');
const LabService = require('../../models/medicalTourism/LabService');

class LabServiceController extends GeneralController {
    constructor() {
        super(LabService);
    }

    async getAllLabServices(req, res) {
        try {
            const { status } = req.query;
            const query = status ? { status } : {};
            const labServices = await LabService.find(query);
            res.status(200).json(labServices);
        } catch (error) {
            console.error("Error fetching labServices:", error);
            res.status(500).json({ message: "Failed to fetch labServices" });
        }
    }
}

module.exports = {
    LabServiceController: new LabServiceController()
};
