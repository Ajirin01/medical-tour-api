const GeneralController = require('./GeneralController');
const LabResult = require('../../models/medicalTourism/LabResult');

const path = require('path'); // Import path module
const fs = require('fs');
class LabResultController extends GeneralController {
    constructor() {
        super(LabResult);
    }

    // Custom GET with optional status filter
    async getAllLabResults(req, res) {
        try {
            const { status } = req.query;
            const query = status ? { status } : {};
            const labResults = await LabResult.find(query).populate("user");
            res.status(200).json(labResults);
        } catch (error) {
            console.error("Error fetching labResults:", error);
            res.status(500).json({ message: "Failed to fetch labResults" });
        }
    }

    // 🔽 Custom create with resultFile image
    async customCreate(req, res) {
        try {
            const labResultData = { ...req.body };

            if (req.file) {
                // Handle file upload path
                labResultData.resultFile = `/uploads/${req.file.filename}`;
            }

            const newPharmacy = await LabResult.create(labResultData);
            res.status(201).json(newPharmacy);
        } catch (error) {
            console.error("LabResult creation error:", error);
            res.status(500).json({ error: error.message });
        }
    }

    // 🔽 Custom update with resultFile image
    async customUpdate(req, res) {
        try {
            const { id } = req.params;
            if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(400).json({ message: "Invalid ID format" });
            }

            const labResult = await LabResult.findById(id);
            if (!labResult) {
                return res.status(404).json({ message: "LabResult not found" });
            }

            const updateData = { ...req.body };

            if (req.file) {
                // 🔥 Delete old resultFile file if it exists
                if (labResult.resultFile) {
                    const oldFilePath = path.join(__dirname, '..', '..', 'public', labResult.resultFile);
                    fs.unlink(oldFilePath, (err) => {
                        if (err) console.warn("Failed to delete old resultFile file:", err.message);
                    });
                }

                // 💾 Set new resultFile path
                updateData.resultFile = `/uploads/${req.file.filename}`;
            }

            const updatedPharmacy = await LabResult.findByIdAndUpdate(id, updateData, { new: true });

            res.status(200).json(updatedPharmacy);
        } catch (error) {
            console.error("LabResult update error:", error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = {
    LabResultController: new LabResultController()
};
