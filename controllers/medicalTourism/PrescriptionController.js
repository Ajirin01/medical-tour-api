const Prescription = require("../../models/medicalTourism/Prescription");
const CartItem = require("../../models/medicalTourism/CartItem");
const GeneralController = require("./GeneralController");

class PrescriptionController extends GeneralController {
  constructor() {
    super(Prescription);
  }

  async uploadPrescription(req, res) {
    try {
      const { user } = req;
      const { itemId } = req.body; // Get the specific cart item ID
      const file = req.file;
  
      if (!file) {
        return res.status(400).json({ error: "Prescription file is required." });
      }
  
      if (!itemId) {
        return res.status(400).json({ error: "Item ID is required." });
      }
  
      // Save the prescription and link it to the specific cart item
      const prescription = new Prescription({
        user: user._id,
        fileUrl: file.path, // Update this based on your storage method
        associatedCartItems: [itemId] // Link to the correct item
      });
  
      await prescription.save();
  
      // 🔹 Update the CartItem to store the prescription ID
      const updatedCartItem = await CartItem.findByIdAndUpdate(
        itemId,
        { prescription: prescription._id, prescriptionLinkStatus: 'pending' }, // Update the prescription field
        { new: true }
      ).populate("product prescription"); // Populate the product and prescription details
  
      if (!updatedCartItem) {
        return res.status(404).json({ error: "Cart item not found." });
      }
  
      res.status(201).json({
        message: "Prescription uploaded successfully!",
        updatedCartItem, // Send back the updated cart item
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getUserPrescriptions(req, res) {
    try {
      const { user } = req;
      const prescriptions = await Prescription.find({
        user: user._id,
        createdAt: { $gte: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) } // Not older than 10 days
      });
      res.status(200).json({ prescriptions });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updatePrescriptionStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body; // <-- This is the fix

      const prescription = await Prescription.findByIdAndUpdate(
        id,
        { status},
        { new: true }
      );


      if (!prescription) return res.status(404).json({ message: "Prescription not found" });

      res.status(200).json({ message: "Prescription approved", prescription });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async rejectPrescription(req, res) {
    try {
      const { id } = req.params;
      const prescription = await Prescription.findByIdAndUpdate(id, { status: "rejected" }, { new: true });

      if (!prescription) return res.status(404).json({ message: "Prescription not found" });

      res.status(200).json({ message: "Prescription rejected", prescription });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }


  async deletePrescription(req, res) {
    try {
      const { id } = req.params;

      const prescription = await Prescription.findById(id);

      if (!prescription) return res.status(404).json({ message: "Prescription not found" });

      // Unlink all associated cart items
      if (prescription.associatedCartItems?.length) {
        await CartItem.updateMany(
          { _id: { $in: prescription.associatedCartItems } },
          {
            $set: {
              prescription: null,
              prescriptionLinkStatus: "missing",
            },
          }
        );
      }

      // Update prescription status and clear links
      prescription.status = "rejected";
      prescription.associatedCartItems = [];
      await prescription.save();

      res.status(200).json({ message: "Prescription rejected", prescription });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }


  async getPrescriptionsByStatus(req, res) {
      try {
          // Extract the status from query parameters
          const { status } = req.query;
  
          // Ensure the status is valid (optional validation)
          const validStatuses = ['pending', 'rejected', 'declined', 'approved'];
          if (!validStatuses.includes(status)) {
              return res.status(400).json({ message: "Invalid status provided" });
          }
  
          // Fetch prescriptions with the specified status
          const prescriptions = await Prescription.find({ status: status })
              .populate('associatedCartItems')
              .populate('user')
  
          if (prescriptions.length === 0) {
              return res.status(200).json({ message: "No prescriptions found for this status" });
          }
  
          // Send the result back
          res.status(200).json(prescriptions);
      } catch (error) {
          console.error("Error fetching prescriptions:", error);
          res.status(500).json({ message: "Server error", error: error.message });
      }
  }
}

module.exports = { PrescriptionController: new PrescriptionController() };
