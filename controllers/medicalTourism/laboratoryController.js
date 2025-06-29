const GeneralController = require('./GeneralController');
const Laboratory = require('../../models/medicalTourism/Laboratory');

class LaboratoryController extends GeneralController {
    constructor() {
        super(Laboratory);
    }

    // Custom GET with optional status filter
    async getAllLaboratories(req, res) {
        try {
            const { status, country, state, city } = req.query;

            const query = {};

            // Handle status
            if (status) query.status = status;

            // Nested location fields under address
            if (country) query["address.country"] = new RegExp(`^${country}$`, "i");
            if (state) query["address.state"] = new RegExp(`^${state}$`, "i");
            if (city) query["address.city"] = new RegExp(`^${city}$`, "i");

            const laboratories = await Laboratory.find(query).sort({ name: 1 });

            res.status(200).json({ success: true, labs: laboratories });
        } catch (error) {
            console.error("Error fetching laboratories:", error);
            res.status(500).json({ success: false, message: "Failed to fetch laboratories" });
        }
    }


    // 🔽 Custom create with license image
    async customCreate(req, res) {
        try {
            const laboratoryData = { ...req.body };

            console.log(laboratoryData)

            if (req.file) {
                // Handle file upload path
                laboratoryData.license = `/uploads/${req.file.filename}`;
            }

            const newPharmacy = await Laboratory.create(laboratoryData);
            res.status(201).json(newPharmacy);
        } catch (error) {
            console.error("Laboratory creation error:", error);
            res.status(500).json({ error: error.message });
        }
    }

    // 🔽 Custom update with license image
    async customUpdate(req, res) {
        try {
            const { id } = req.params;
            if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(400).json({ message: "Invalid ID format" });
            }

            const laboratory = await Laboratory.findById(id);
            if (!laboratory) {
                return res.status(404).json({ message: "Laboratory not found" });
            }

            const updateData = { ...req.body };

            if (req.file) {
                // 🔥 Delete old license file if it exists
                if (laboratory.license) {
                    const oldFilePath = path.join(__dirname, '..', '..', 'public', laboratory.license);
                    fs.unlink(oldFilePath, (err) => {
                        if (err) console.warn("Failed to delete old license file:", err.message);
                    });
                }

                // 💾 Set new license path
                updateData.license = `/uploads/${req.file.filename}`;
            }

            const updatedPharmacy = await Laboratory.findByIdAndUpdate(id, updateData, { new: true });

            res.status(200).json(updatedPharmacy);
        } catch (error) {
            console.error("Laboratory update error:", error);
            res.status(500).json({ error: error.message });
        }
    }
}


module.exports = {
    LaboratoryController: new LaboratoryController()
};
