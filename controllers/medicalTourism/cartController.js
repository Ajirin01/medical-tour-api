const GeneralController = require('./GeneralController');
const Cart = require('../../models/medicalTourism/Cart');
const CartItem = require('../../models/medicalTourism/CartItem')
const Prescription = require('../../models/medicalTourism/Prescription')
const Medication = require('../../models/medicalTourism/Medication');
const LabService = require('../../models/medicalTourism/LabService');

class CartController extends GeneralController {
    constructor() {
        super(Cart);

        this.getCart = this.getCart.bind(this); 
        this.addItemToCart = this.addItemToCart.bind(this); 
        this.updateCartItem = this.updateCartItem.bind(this); 
    }

    getUserCart = async (userId) => {
      try {
        const cart = await Cart.findOne({ user: userId })
          .populate("items"); // Populate CartItem first
    
        if (!cart || cart.items.length === 0) {
          return [];
        }
    
        // Dynamically populate products based on their productType
        const populatedItems = await Promise.all(
          cart.items.map(async (cartItem) => {
            let product;
            if (cartItem.productType === 'Medication') {
              product = await Medication.findById(cartItem.product);
            } else if (cartItem.productType === 'LabService') {
              product = await LabService.findById(cartItem.product);
            }
            cartItem.product = product;
            return cartItem;
          })
        );
    
        // Update the cart with populated items
        cart.items = populatedItems;
    
        return cart;
      } catch (error) {
        console.error("Error fetching cart:", error);
       return { message: "Server error" };
      }
    }

    async getCart(req, res) {
      try {
        const cart = await this.getUserCart(req.user.id);  // Ensure await here
        res.status(200).json(cart);
      } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).json({ message: "Server error" });
      }
    }
    
    async linkPrescription(req, res) {
        try {
          const { cartItemId, prescriptionId } = req.body;
      
          // Find the cart item
          const cartItem = await CartItem.findById(cartItemId);
          if (!cartItem) {
            return res.status(404).json({ message: "Cart item not found" });
          }
      
          // Link the prescription to the cart item
          cartItem.prescription = prescriptionId;
          cartItem.prescriptionLinkStatus = "pending";
          await cartItem.save();
      
          // Update the prescription to include this cart item if not already linked
          const prescription = await Prescription.findById(prescriptionId);
          if (!prescription) {
            return res.status(404).json({ message: "Prescription not found" });
          }
      
          // Only push if it's not already in the list
          if (!prescription.associatedCartItems.includes(cartItemId)) {
            prescription.associatedCartItems.push(cartItemId);
            await prescription.save();
          }
      
          res.json({
            message: "Prescription linked successfully",
            cartItem,
            prescription,
          });
        } catch (error) {
          res.status(500).json({ message: "Server error", error: error.message });
        }
    }

    async unlinkPrescription(req, res) {
        try {
          const { cartItemId } = req.body;
      
          // Find the cart item
          let cartItem = await CartItem.findById(cartItemId);
          if (!cartItem) {
            return res.status(404).json({ message: "Cart item not found" });
          }
      
          // Check if a prescription is linked
          if (!cartItem.prescription) {
            return res.status(400).json({ message: "No prescription linked to this cart item" });
          }
      
          // Remove cartItemId from associatedCartItems in the prescription
          await Prescription.findByIdAndUpdate(
            cartItem.prescription,
            { $pull: { associatedCartItems: cartItem._id } }
          );
      
          // Unlink the prescription from the cart item
          cartItem.prescription = null;
          cartItem.prescriptionLinkStatus = "missing";
          await cartItem.save();
      
          res.json({ message: "Prescription unlinked successfully", cartItem });
        } catch (error) {
          res.status(500).json({ message: "Server error", error: error.message });
        }
    }
      

    async addItemToCart(req, res) {
      try {
        const { user } = req;
        const { productId, quantity, price, prescriptionId, productType } = req.body;
    
        // Find or create the user's cart
        let cart = await Cart.findOne({ user: user._id });
        if (!cart) {
          cart = new Cart({ user: user._id, items: [], totalPrice: 0 });
          await cart.save();
        }
    
        // Check if the product already exists in the cart
        let cartItem = await CartItem.findOne({ cart: cart._id, product: productId });
    
        if (cartItem) {
          // If it exists, update the quantity
          cartItem.quantity += quantity;
          await cartItem.save();
        } else {
          // If not, create a new CartItem
          cartItem = new CartItem({
            cart: cart._id,
            user: user._id,
            product: productId,
            quantity,
            price,
            prescription: prescriptionId || null,
            productType: productType
          });
          await cartItem.save();
    
          // Add the new item reference to the cart
          cart.items.push(cartItem._id);
        }
    
        // Update total price
        cart.totalPrice += quantity * price;
        await cart.save();
    
        const populatedCart = await this.getUserCart(req.user.id);
    
        res.status(201).json({ message: 'Item added to cart!', cart: populatedCart });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
    

    async updateCartItem(req, res) {
        try {
            const { cartItemId, quantity } = req.body;
    
            let cartItem = await CartItem.findById(cartItemId);
            if (!cartItem) return res.status(404).json({ message: "Cart item not found" });
    
            let cart = await Cart.findById(cartItem.cart).populate("items");
            
            if (quantity <= 0) {
                // Remove the item if quantity is zero or negative
                cart.items = cart.items.filter(item => item.toString() !== cartItemId);
                cart.totalPrice -= cartItem.quantity * cartItem.price;
                await cart.save();
                await CartItem.findByIdAndDelete(cartItemId);
    
                return res.json({ message: "Cart item removed", cart });
            }
    
            // Otherwise, just update the quantity
            cartItem.quantity = quantity;
            await cartItem.save();
    
            // Recalculate total price
            cart.totalPrice = cart.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
            await cart.save();

            const populatedCart = await this.getUserCart(req.user.id);
    
            res.status(200).json({ message: "Cart item updated successfully!", cart: populatedCart });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async removeItemFromCart(req, res) {
        try {
          const { user } = req;
          const { cartItemId } = req.params;
      
          // Find the cart item
          const cartItem = await CartItem.findById(cartItemId);
          if (!cartItem) return res.status(404).json({ error: "Cart item not found" });
      
          // Find the user's cart
          let cart = await Cart.findOne({ user: user._id });
          if (!cart) return res.status(404).json({ error: "Cart not found" });
      
          // Remove item reference from the cart
          cart.items = cart.items.filter(item => item.toString() !== cartItemId);
      
          // Update total price
          cart.totalPrice -= cartItem.quantity * cartItem.price;
          await cart.save();
      
          // Delete the cart item
          await CartItem.findByIdAndDelete(cartItemId);
      
          const populatedCart = await Cart.findById(cart._id).populate({
                path: "items",
                populate: {
                    path: "product",
                    model: "Medication",
                },
            });

            res.status(200).json({ message: "Item added to cart!", cart: populatedCart });
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
    }

    async approveCartPrescriptionLink(req, res) {
        try {
            const { cartItemId } = req.body;
    
            // Find the cart item
            let cartItem = await CartItem.findById(cartItemId).populate("prescription");
            if (!cartItem) {
                return res.status(404).json({ message: "Cart item not found" });
            }
    
            // Ensure a prescription is linked
            if (!cartItem.prescription) {
                return res.status(400).json({ message: "No prescription linked to this cart item" });
            }
    
            // Approve the prescription link
            cartItem.prescriptionLinkStatus = "approved";
            await cartItem.save();
    
            res.json({ message: "Prescription link approved successfully", cartItem });
        } catch (error) {
            res.status(500).json({ message: "Server error", error: error.message });
        }
    }
    
    async rejectCartPrescriptionLink(req, res) {
        try {
            const { cartItemId, reason } = req.body;
    
            // Find the cart item
            let cartItem = await CartItem.findById(cartItemId).populate("prescription");
            if (!cartItem) {
                return res.status(404).json({ message: "Cart item not found" });
            }
    
            // Ensure a prescription is linked
            if (!cartItem.prescription) {
                return res.status(400).json({ message: "No prescription linked to this cart item" });
            }
    
            // Reject the prescription link
            cartItem.prescriptionLinkStatus = "declined";
            await cartItem.save();
    
            res.json({ message: "Prescription link rejected", reason, cartItem });
        } catch (error) {
            res.status(500).json({ message: "Server error", error: error.message });
        }
    }

    async updateCartPrescriptionLinkStatus(req, res) {
        try {
          const { cartItemId, status } = req.body;
      
          if (!["pending", "approved", "declined"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
          }
      
          // Find the cart item
          const cartItem = await CartItem.findById(cartItemId).populate("prescription");
          if (!cartItem) {
            return res.status(404).json({ message: "Cart item not found" });
          }
      
          // Ensure a prescription is linked
          if (!cartItem.prescription) {
            return res.status(400).json({ message: "No prescription linked to this cart item" });
          }
      
          // Update the link status
          cartItem.prescriptionLinkStatus = status;
          await cartItem.save();
      
          res.json({
            message: `Prescription link ${status} successfully`,
            cartItem
          });
        } catch (error) {
          res.status(500).json({ message: "Server error", error: error.message });
        }
    }

    async clearCart(req, res) {
        try {
            const cart = await Cart.findOne({ user: req.user.id });
            if (!cart) return res.json({ message: "Cart already empty" });
    
            await CartItem.deleteMany({ cart: cart._id });
    
            // Reset total price before deleting
            cart.totalPrice = 0;
            await cart.save();
    
            await Cart.findOneAndDelete({ user: req.user.id });
    
            res.json({ message: "Cart cleared" });
        } catch (error) {
            res.status(500).json({ message: error.message });
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
            const prescriptions = await CartItem.find({ prescriptionLinkStatus: status })
                .populate('prescription') // Populate prescription details
                // .populate('associatedCartItems')
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

module.exports = {
    CartController: new CartController()
};
