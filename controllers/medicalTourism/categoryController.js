const GeneralController = require('./GeneralController');
const Category = require('../../models/medicalTourism/Category');

class CategoryController extends GeneralController {
    constructor() {
        super(Category);
    }

    async getAllCategories(req, res) {
        try {
            const categories = await Category.find(); // Fetch all categories without pagination
            res.status(200).json(categories);
        } catch (error) {
            console.error("Error fetching categories:", error);
            res.status(500).json({ message: "Failed to fetch categories" });
        }
    }

    
}

module.exports = {
    CategoryController: new CategoryController()
};
