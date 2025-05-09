const GeneralController = require('./GeneralController');
const Hospital = require('../../models/medicalTourism/Hospital');

class HospitalController extends GeneralController {
    constructor() {
      super(Hospital);
    }
  
    async createCustom(req, res) {
      try {
        const data = req.body;
  
        // If image uploaded, attach its path (assuming filename saved by multer)
        if (req.file) {
          data.photo = req.file.path || req.file.filename;
        }
  
        const hospital = await Hospital.create(data);
        res.status(201).json(hospital);
      } catch (error) {
        console.error("Create hospital failed:", error);
        res.status(500).json({ message: "Failed to create hospital" });
      }
    }
  
    async updateCustom(req, res) {
      try {
        const { id } = req.params;
        const data = req.body;
  
        if (req.file) {
          data.photo = req.file.path || req.file.filename;
        }
  
        const updated = await Hospital.findByIdAndUpdate(id, data, { new: true });
  
        if (!updated) {
          return res.status(404).json({ message: "Hospital not found" });
        }
  
        res.status(200).json(updated);
      } catch (error) {
        console.error("Update hospital failed:", error);
        res.status(500).json({ message: "Failed to update hospital" });
      }
    }
}

module.exports = {
    HospitalController: new HospitalController()
};
