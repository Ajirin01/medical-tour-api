const GeneralController = require('./GeneralController');
const ShippingAddress = require("../../models/medicalTourism/ShippingAddress");
const mongoose = require("mongoose");

class ShippingAddressController extends GeneralController {
    constructor() {
        super(ShippingAddress);
    }

    async getAllCustom (req, res) {
        try {
            const { page = 1, limit = 5, sort = '-createdAt', search, ...filters } = req.query;
    
            // If a search query exists, add it to the filters
            if (search) {
                filters.name = { $regex: search, $options: 'i' }; // Case-insensitive search for 'name'
            }
    
            const skip = (page - 1) * limit;
    
            const items = await ShippingAddress.find(filters)
                .populate("user")
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit));
    
            const total = await ShippingAddress.countDocuments(filters);
    
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

    async createShippingAddress(req, res) {
        try {
            const { street, city, state, country, postalCode, isDefault } = req.body;
            
            // Create a new shipping address
            const newAddress = new ShippingAddress({
                user: req.user.id,  // Assuming you're using JWT to get the user's ID
                address: { street, city, state, country, postalCode },
                isDefault: isDefault || false,
            });

            // If setting the address as default, remove default status from other addresses
            if (isDefault) {
                await ShippingAddress.updateMany({ user: req.user.id }, { isDefault: false });
            }

            await newAddress.save();
            res.status(201).json({ message: "Shipping address created successfully", newAddress });
        } catch (error) {
            console.error("Error creating shipping address:", error);
            res.status(500).json({ message: "Failed to create shipping address" });
        }
    }

    async updateShippingAddress(req, res) {
        try {
          const { id } = req.params;
          if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid ID format" });
          }
      
          const { address: newAddress, isDefault } = req.body;
      
          if (!newAddress || typeof newAddress !== "object") {
            return res.status(400).json({ message: "Address data is required" });
          }
      
          const address = await ShippingAddress.findById(id);
          if (!address) {
            return res.status(404).json({ message: "Shipping address not found" });
          }
      
          // If setting this as default, unset others
          if (isDefault) {
            await ShippingAddress.updateMany(
              { user: req.user.id },
              { isDefault: false }
            );
          }
      
          // Properly assign nested fields
          address.address = {
            street: newAddress.street || address.address.street,
            city: newAddress.city || address.address.city,
            state: newAddress.state || address.address.state,
            country: newAddress.country || address.address.country,
            postalCode: newAddress.postalCode || address.address.postalCode,
          };
      
          address.isDefault = isDefault ?? address.isDefault;
      
          await address.save();
          res.status(200).json({ message: "Shipping address updated successfully", address });
        } catch (error) {
            console.error("Error updating shipping address:", error.message || error);

            res.status(500).json({
              message: "Failed to update shipping address",
              error: error.message || "Unknown error",
            });
        }
    }
      

    async deleteShippingAddress(req, res) {
        try {
            const { id } = req.params;
            if (!mongoose.isValidObjectId(id)) {
                return res.status(400).json({ message: "Invalid ID format" });
            }

            const address = await ShippingAddress.findById(id);
            if (!address || address.user.toString() !== req.user.id) {
                return res.status(404).json({ message: "Shipping address not found" });
            }

            // If deleting a default address, assign a new default if available
            if (address.isDefault) {
                const newDefaultAddress = await ShippingAddress.findOne({ user: req.user.id, _id: { $ne: id } });
                if (newDefaultAddress) {
                    newDefaultAddress.isDefault = true;
                    await newDefaultAddress.save();
                }
            }

            await address.remove();
            res.status(200).json({ message: "Shipping address deleted successfully" });
        } catch (error) {
            console.error("Error deleting shipping address:", error);
            res.status(500).json({ message: "Failed to delete shipping address" });
        }
    }

    // Get all shipping addresses for the user by userId in URL
    async getUserShippingAddresses(req, res, next) {
        try {
        const { userId } = req.params;
    
        const addresses = await ShippingAddress.find({ user: userId });
    
        res.status(200).json({
            success: true,
            addresses
        });
        } catch (error) {
        next(error);
        }
    }

    // Get a specific shipping address by ID
    async getShippingAddressById(req, res, next) {
        try {
            const { id } = req.params;

            const address = await ShippingAddress.findOne({
                _id: id,
                userId: req.user.id // Ensure the user is viewing their own address
            });

            if (!address) {
                return res.status(404).json({ success: false, message: 'Address not found' });
            }

            res.status(200).json({
                success: true,
                data: address
            });
        } catch (error) {
            next(error);
        }
    }

    async listShippingAddresses(req, res) {
        try {
            const addresses = await ShippingAddress.find({ user: req.user.id });
            res.status(200).json(addresses);
        } catch (error) {
            console.error("Error fetching shipping addresses:", error);
            res.status(500).json({ message: "Failed to fetch shipping addresses" });
        }
    }
}

module.exports = {
    ShippingAddressController: new ShippingAddressController()
};
