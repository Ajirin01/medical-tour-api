const GeneralController = require('./GeneralController');
const Order = require('../../models/medicalTourism/Order');
const Medication = require('../../models/medicalTourism/Medication');
const LabService = require('../../models/medicalTourism/LabService');
const { Parser } = require('json2csv');
const mongoose = require("mongoose");

class OrderController extends GeneralController {
  constructor() {
    super(Order);
  }

  async getOrderById (req, res) {
    const { id } = req.params;
  
    try {
      const order = await Order.findById(id)
        .populate('user', 'firstName lastName email') // populate user info
        .populate('placedBy', 'firstName lastName email') // optional: populate admin or person who placed it
        .populate({
          path: 'items.product',
          populate: { path: 'pharmacy' }, // in case product has subrefs like pharmacy
        });
  
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
  
      res.status(200).json({ order });
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  async getAllOrders(req, res) {
    try {
      const { exportCSV, page, limit, from, to } = req.query;
      const matchConditions = {};
  
      const userRole = req.user.role; // Assuming `role` is part of the user object in `req.user`
      const userId = req.user._id; // Get the logged-in user's ID
  
      // Check the role and adjust the query
      if (userRole === 'admin') {
        // Admin can see all orders, no need to filter by user or pharmacy
      } else if (userRole === 'pharmacyAdmin') {
        matchConditions['items.product.pharmacy'] = req.user.pharmacy;
      } else if (userRole === 'labAdmin') {
        matchConditions['items.product.laboratory'] = req.user.laboratory;
      } else if (userRole === 'user') {
        // Regular user only sees their own orders
        matchConditions.user = userId;
      }
  
      // Optional date filtering
      if (from || to) {
        matchConditions.createdAt = {};
        if (from) matchConditions.createdAt.$gte = new Date(from);
        if (to) matchConditions.createdAt.$lte = new Date(to);
      }
  
      // Fetch orders without populate
      const baseQuery = Order.find(matchConditions)
        .select('user placedBy items category totalAmount status paymentStatus createdAt shippingAddress')
        .sort({ createdAt: -1 });
  
      // Pagination setup
      const usePagination = page && limit;
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
  
      const countQuery = Order.countDocuments(matchConditions);
  
      if (usePagination) {
        baseQuery.skip((pageNum - 1) * limitNum).limit(limitNum);
      }
  
      const [orders, total] = await Promise.all([
        baseQuery.exec(),
        usePagination ? countQuery : Promise.resolve(null),
      ]);
  
      // Manually fetch the product details for each order
      const orderIds = orders.map(order => order._id);
      const productIds = orders.flatMap(order => order.items.map(item => item.product));
  
      let products = [];
      if (productIds.length > 0) {
        // Fetch products based on the category (Medication or LabService)
        if (orders.some(order => order.category === 'Medication')) {
          const medications = await Medication.find({ '_id': { $in: productIds } });
          products = [...products, ...medications];  // Merge medications into products
        }
        if (orders.some(order => order.category === 'LabService')) {
          const labServices = await LabService.find({ '_id': { $in: productIds } });
          products = [...products, ...labServices];  // Merge lab services into products
        }
      }



      // Convert products to a map for easy lookup (mapping by product ID)
      const productMap = products.reduce((acc, product) => {
        acc[product._id.toString()] = product;
        return acc;
      }, {});


      // Attach product details to each order's items
      orders.forEach(order => {
        order.items.forEach(item => {
          const product = productMap[item.product.toString()]; // Ensure item.product is the product ID
          if (product) {
            item.product = product;  // Replace product ID with the full product object
          }
        });
      });

  
      // CSV export
      if (exportCSV === 'true') {
        const flatOrders = orders.map(order => ({
          orderId: order._id,
          user: `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || 'Unknown',
          userEmail: order.user?.email || 'Unknown',
          placedBy: order.placedBy
            ? `${order.placedBy.firstName || ''} ${order.placedBy.lastName || ''}`.trim()
            : 'N/A',
          category: order.category,
          items: order.items.map(i => {
            const name = i.product?.name || 'Product';
            return `${name} x${i.quantity} @$${i.price}`;
          }).join('; '),
          totalAmount: order.totalAmount,
          status: order.status,
          paymentStatus: order.paymentStatus,
          createdAt: order.createdAt.toISOString(),
        }));
  
        const parser = new Parser();
        const csv = parser.parse(flatOrders);
  
        res.header('Content-Type', 'text/csv');
        res.attachment('orders.csv');
        return res.send(csv);
      }
  
      // JSON response
      res.json({
        orders,
        ...(usePagination && {
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          }
        })
      });
  
    } catch (err) {
      console.error("Error in getAllOrders:", err);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  }

  async getOrdersByUser(req, res) {
    try {
      const userId = req.params.userId || req.query.userId;
      if (!userId) return res.status(400).json({ message: "User ID is required" });
  
      // Extract query filters
      const { status, paymentStatus, category, from, to } = req.query;
  
      // Build dynamic filter object
      const filter = { user: userId };
  
      if (status) filter.status = status;
      if (paymentStatus) filter.paymentStatus = paymentStatus;
      if (category) filter.category = category;
  
      if (from || to) {
        filter.createdAt = {};
        if (from) filter.createdAt.$gte = new Date(from);
        if (to) filter.createdAt.$lte = new Date(to);
      }
  
      const orders = await Order.find(filter).sort({ createdAt: -1 });
      res.json(orders);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch user orders", error:err });
    }
  }

  async createOrderManually(req, res) {
    try {
      const { user, placedBy, category, items, totalAmount, status = "pending", paymentStatus = "pending", paymentReference } = req.body;
  
      const missingFields = [];

      if (!user) missingFields.push("user");
      if (!Array.isArray(items) || items.length === 0) missingFields.push("items");
      if (!totalAmount) missingFields.push("totalAmount");
      if (!placedBy) missingFields.push("placedBy");

      if (missingFields.length > 0) {
        return res.status(400).json({
          message: `Missing or invalid fields: ${missingFields.join(", ")}`
        });
      }
  
      const newOrder = new Order({
        user,
        placedBy,
        category,
        items,
        totalAmount,
        status,
        paymentStatus,
        paymentReference,
      });

      await Payment.create({
        user, // Associate payment with the user
        totalAmount, // Amount in the smallest unit (e.g., cents)
        currency: "USD",
        status: 'paid', // Mark payment as successful
        paymentReference, // Unique payment reference from Stripe
        transactionId: null,
        paymentMethod: 'card', // You can add logic to determine this
        metadata: [], // Save full session details as metadata (optional)
      });
  
      await newOrder.save();
      res.status(201).json(newOrder);  // Sending the response here
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to create order", error: err }); // This line may cause the error if already sent
    }
  }
}

module.exports = {
  OrderController: new OrderController()
};
