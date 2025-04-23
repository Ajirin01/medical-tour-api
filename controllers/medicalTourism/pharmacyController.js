const Pharmacy = require('../../models/medicalTourism/Pharmacy');
const GeneralController = require('./GeneralController');
const fs = require('fs');
const path = require('path');

class PharmacyController extends GeneralController {
    constructor() {
        super(Pharmacy);
    }

    // Custom GET with optional status filter
    async getAllPharmacies(req, res) {
        try {
            const { status } = req.query;
            const query = status ? { status } : {};
            const pharmacies = await Pharmacy.find(query);
            res.status(200).json(pharmacies);
        } catch (error) {
            console.error("Error fetching pharmacies:", error);
            res.status(500).json({ message: "Failed to fetch pharmacies" });
        }
    }

    // 🔽 Custom create with license image
    async customCreate(req, res) {
        try {
            const pharmacyData = { ...req.body };

            if (req.file) {
                // Handle file upload path
                pharmacyData.license = `/uploads/${req.file.filename}`;
            }

            const newPharmacy = await Pharmacy.create(pharmacyData);
            res.status(201).json(newPharmacy);
        } catch (error) {
            console.error("Pharmacy creation error:", error);
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

            const pharmacy = await Pharmacy.findById(id);
            if (!pharmacy) {
                return res.status(404).json({ message: "Pharmacy not found" });
            }

            const updateData = { ...req.body };

            if (req.file) {
                // 🔥 Delete old license file if it exists
                if (pharmacy.license) {
                    const oldFilePath = path.join(__dirname, '..', '..', 'public', pharmacy.license);
                    fs.unlink(oldFilePath, (err) => {
                        if (err) console.warn("Failed to delete old license file:", err.message);
                    });
                }

                // 💾 Set new license path
                updateData.license = `/uploads/${req.file.filename}`;
            }

            const updatedPharmacy = await Pharmacy.findByIdAndUpdate(id, updateData, { new: true });

            res.status(200).json(updatedPharmacy);
        } catch (error) {
            console.error("Pharmacy update error:", error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = {
    PharmacyController: new PharmacyController()
};
