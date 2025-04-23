const GeneralController = require("./GeneralController");
const Brand = require("../../models/medicalTourism/Brand");
const path = require("path");
const fs = require("fs");

class BrandController extends GeneralController {
    constructor() {
        super(Brand);
    }

    async getAllBrands(req, res) {
        try {
            const brands = await Brand.find(); // Fetch all brands without pagination
            res.status(200).json(brands);
        } catch (error) {
            console.error("Error fetching brands:", error);
            res.status(500).json({ message: "Failed to fetch brands" });
        }
    }

    // Override create function to handle FormData (file upload)
    async createBrand(req, res) {
        try {
            const { name, description, status } = req.body;

            console.log("Received body:", req.body);
            console.log("Received file:", req.file);

            if (!name || !description) {
                return res.status(400).json({ message: "Name and description are required" });
            }

            let logoUrl = null;
            if (req.file) {
                const fileExt = path.extname(req.file.originalname).toLowerCase();
                const allowedExtensions = [".jpg", ".jpeg", ".png", ".svg", ".webp"];

                if (!allowedExtensions.includes(fileExt)) {
                    return res.status(400).json({ message: "Invalid file format. Allowed formats: JPG, PNG, SVG, WEBP" });
                }

                logoUrl = `/uploads/${req.file.filename}`;
            }

            const brand = await Brand.create({
                name,
                description,
                status: status || "active",
                logo: logoUrl,
            });

            res.status(201).json({ message: "Brand created successfully", brand });
        } catch (error) {
            console.error("Error creating brand:", error);
            res.status(500).json({ message: "Failed to create brand" });
        }
    }

    async updateBrand(req, res) {
        try {
            const { name, description, status } = req.body;
            const { id } = req.params;
    
            if (!name || !description) {
                return res.status(400).json({ message: "Name and description are required" });
            }
    
            let updatedData = { name, description, status };
    
            if (req.file) {
                const fileExt = path.extname(req.file.originalname).toLowerCase();
                const allowedExtensions = [".jpg", ".jpeg", ".png", ".svg", ".webp"];
                if (!allowedExtensions.includes(fileExt)) {
                    return res.status(400).json({ message: "Invalid file format." });
                }
                updatedData.logo = `/uploads/${req.file.filename}`;
            }
    
            const brand = await Brand.findByIdAndUpdate(id, updatedData, { new: true });
    
            if (!brand) {
                return res.status(404).json({ message: "Brand not found" });
            }
    
            res.status(200).json({ message: "Brand updated successfully", brand });
        } catch (error) {
            console.error("Error updating brand:", error);
            res.status(500).json({ message: "Failed to update brand" });
        }
    }
    
}

module.exports = {
    BrandController: new BrandController()
};
