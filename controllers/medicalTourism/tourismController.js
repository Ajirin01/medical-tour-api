const mongoose = require('mongoose');
const TourismPackage = require('../../models/medicalTourism/TourismPackage');
const Booking = require('../../models/medicalTourism/Booking');

exports.getPackages = async (req, res) => {
    try {
        const packages = await TourismPackage.find();
        res.status(200).json(packages);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Create a new tourism package
exports.createPackage = async (req, res) => {
    try {
        const { name, description, price, location, duration, services } = req.body;
        const image = req.file ? `/uploads/${req.file.filename}` : null; // Get the uploaded file path

        const newPackage = new TourismPackage({
            name,
            description,
            price,
            location,
            duration,
            services: services ? services.split(',') : [], // Convert string to array
            image
        });

        await newPackage.save();
        res.status(201).json({ message: 'Package created successfully', newPackage });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};


// Update an existing tourism package
exports.updatePackage = async (req, res) => {
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
            updateData.image = `/uploads/${req.file.filename}`; // Save image path
        }

        // ✅ Update the package
        const updatedPackage = await TourismPackage.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedPackage) {
            return res.status(404).json({ message: "Package not found" });
        }

        res.status(200).json({ message: "Package updated successfully", updatedPackage });
    } catch (error) {
        console.error("Error updating package:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};;

// Delete a tourism package
exports.deletePackage = async (req, res) => {
    try {
        const { id } = req.params;
        await TourismPackage.findByIdAndDelete(id);
        res.status(200).json({ message: 'Package deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// exports.bookPackage = async (req, res) => {
//     try {
//         const { packageId, patientId } = req.body;
//         const newBooking = new Booking({ packageId, patientId, status: 'Pending' });
//         await newBooking.save();
//         res.status(201).json({ message: 'Booking successful', newBooking });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error', error });
//     }
// };

// exports.updateBooking = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const updatedBooking = await Booking.findByIdAndUpdate(id, req.body, { new: true });
//         res.status(200).json({ message: 'Booking updated', updatedBooking });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error', error });
//     }
// };

// exports.cancelBooking = async (req, res) => {
//     try {
//         const { id } = req.params;
//         await Booking.findByIdAndDelete(id);
//         res.status(200).json({ message: 'Booking canceled' });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error', error });
//     }
// };
