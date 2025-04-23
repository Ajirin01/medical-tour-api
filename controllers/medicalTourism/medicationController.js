const GeneralController = require('./GeneralController');
const Medication = require('../../models/medicalTourism/Medication');

class MedicationController extends GeneralController {
    constructor() {
        super(Medication);
    }

    // Override getAll with pagination, population, and optional filtering
    async getAllWithBrandAndCategory(req, res) {
        try {
            let { page = 1, perpage = 10, search = "" } = req.query;
            page = parseInt(page) || 1;
            perpage = parseInt(perpage) || 10;

            if (page < 1 || perpage < 1) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid page or perpage value.",
                });
            }

            // Search filter: case-insensitive match for name
            const query = search ? { name: new RegExp(search, "i") } : {};

            // Fetch medications with pagination & population
            const medications = await Medication.find(query)
                .populate({ path: 'brand', model: 'Brand', select: 'name description logo' })
                .populate({ path: 'category', model: 'Category', select: 'name description' })
                .skip((page - 1) * perpage)
                .limit(perpage)
                

            const totalCount = await Medication.countDocuments(query); // Count only matching records
            // console.log(medications); // Check if brand & category exist in logs
            res.status(200).json({
                success: true,
                total: totalCount,
                page,
                perpage,
                pages: Math.ceil(totalCount / perpage),
                data: medications,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Error fetching medications",
                error: error.message,
            });
        }
    }
}

module.exports = {
    MedicationController: new MedicationController()
};
