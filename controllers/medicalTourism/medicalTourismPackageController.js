const GeneralController = require('./GeneralController');
const MedicalTourismPackage = require('../../models/medicalTourism/MedicalTourismPackage');
const path = require('path'); // Import path module
const fs = require('fs');
const mongoose = require("mongoose");

class MedicalTourismPackageController extends GeneralController {
    constructor() {
        super(MedicalTourismPackage);
    }

    // Custom GET with optional status filter
    async getAllPackages(req, res) {
        try {
            const { status } = req.query;
            const query = status ? { status } : {};
            const packages = await MedicalTourismPackage.find(query);
            res.status(200).json(packages);
        } catch (error) {
            console.error("Error fetching packages:", error);
            res.status(500).json({ message: "Failed to fetch packages" });
        }
    }

    // Create a new tourism package
    async createPackage(req, res){
        try {
            const { name, description, price, location, duration, services } = req.body;
            const photo = req.file ? `/uploads/${req.file.filename}` : null; // Get the uploaded file path
    
            const newPackage = new MedicalTourismPackage({
                name,
                description,
                price,
                location,
                duration,
                services: services ? services.split(',') : [], // Convert string to array
                photo
            });
    
            await newPackage.save();
            res.status(201).json({ message: 'Package created successfully', newPackage });
        } catch (error) {
            res.status(500).json({ message: 'Server error', error });
        }
    }
    
    
    // Update an existing tourism package
    async updatePackage(req, res){
        try {
            const { id } = req.params;
    
            // ✅ Check if ID is valid
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid package ID" });
            }
    
            // ✅ Extract request data
            let updateData = req.body;
    
            // ✅ Check if an image file was uploaded
            if (req.file) {
                updateData.photo = `/uploads/${req.file.filename}`; // Save image path
            }
    
            // ✅ Update the package
            const updatedPackage = await MedicalTourismPackage.findByIdAndUpdate(id, updateData, { new: true });
    
            if (!updatedPackage) {
                return res.status(404).json({ message: "Package not found" });
            }
    
            res.status(200).json({ message: "Package updated successfully", updatedPackage });
        } catch (error) {
            console.error("Error updating package:", error);
            res.status(500).json({ message: "Server error", error: error.message });
        }
    }
    
    // Delete a tourism package
    async deletePackage(req, res){
        try {
            const { id } = req.params;
            await MedicalTourismPackage.findByIdAndDelete(id);
            res.status(200).json({ message: 'Package deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Server error', error });
        }
    }
}

module.exports = {
    MedicalTourismPackageController: new MedicalTourismPackageController()
};
