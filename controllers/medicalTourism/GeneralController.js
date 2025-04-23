const mongoose = require('mongoose'); 
const Prescription = require("../../models/medicalTourism/Prescription");


class GeneralController {
    constructor(model) {
        if (!model) {
            throw new Error("Model is required in GeneralController");
        }
        // console.log("Model assigned:", model.modelName)
        this.model = model;
    }

    create = async (req, res) => {
        try {
            const newItem = await this.model.create(req.body);
            res.status(201).json(newItem);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    update = async (req, res) => {
        try {
            const { id } = req.params;
            if (!mongoose.isValidObjectId(id)) {
                return res.status(400).json({ message: "Invalid ID format" });
            }

            const updatedItem = await this.model.findByIdAndUpdate(id, req.body, { new: true });
            if (!updatedItem) {
                return res.status(404).json({ message: "Not found" });
            }

            res.status(200).json(updatedItem);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    getAll = async (req, res) => {
        try {
            const { page = 1, limit = 5, sort = '-createdAt', search, ...filters } = req.query;
    
            // If a search query exists, add it to the filters
            if (search) {
                filters.name = { $regex: search, $options: 'i' }; // Case-insensitive search for 'name'
            }
    
            const skip = (page - 1) * limit;
    
            const items = await this.model.find(filters)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit));
    
            const total = await this.model.countDocuments(filters);
    
            res.status(200).json({
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                data: items
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    getOne = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
        }

        let item;

        if (this.model.modelName === "Prescription") {
        item = await Prescription.findById(id)
            .populate("user", "firstName lastName email")
            .populate({
            path: "associatedCartItems",
            populate: {
                path: "product",
                select: "name image price prescriptionRequired",
            },
            });
        } else {
        item = await this.model.findById(id);
        }

        if (!item) {
        return res.status(404).json({ message: "Not found" });
        }

        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
    };


    delete = async (req, res) => {
        try {
            const { id } = req.params;
            if (!mongoose.isValidObjectId(id)) {
                return res.status(400).json({ message: "Invalid ID format" });
            }

            const deletedItem = await this.model.findByIdAndDelete(id);
            if (!deletedItem) {
                return res.status(404).json({ message: "Not found" });
            }

            res.status(200).json({ message: "Deleted successfully" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
}

module.exports = GeneralController;
