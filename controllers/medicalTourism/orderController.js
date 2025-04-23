const GeneralController = require('./GeneralController');
const Order = require('../../models/medicalTourism/Order');
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
      const {
        category,
        status,
        paymentStatus,
        userId,
        exportCSV,
        page,
        limit,
        from,
        to,
      } = req.query;

      const matchConditions = {};

      // Build filters
      if (category) matchConditions.category = category;
      if (status) matchConditions.status = status;
      if (paymentStatus) matchConditions.paymentStatus = paymentStatus;
      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        matchConditions.user = userId;
      }

      // Optional date filtering
      if (from || to) {
        matchConditions.createdAt = {};
        if (from) matchConditions.createdAt.$gte = new Date(from);
        if (to) matchConditions.createdAt.$lte = new Date(to);
      }

      // Build query
      const baseQuery = Order.find(matchConditions)
        .populate('user', 'firstName lastName email')
        .populate('placedBy', 'firstName lastName email')
        .populate({
          path: 'items.product',
          populate: { path: 'pharmacy' }, // if needed
        })
        .populate('shippingAddress')
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
