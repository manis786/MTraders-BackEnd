import Order from '../models/order.model.js';
import Product from '../models/product.model.js';

// @desc    Create new order & decrement stock with sequential orderNumber
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items provided');
  }

  // 1. Find the latest order to get the highest orderNumber (Start from 1001 if none exists)
  const lastOrder = await Order.findOne().sort({ orderNumber: -1 });
  const nextOrderNumber = lastOrder && lastOrder.orderNumber ? lastOrder.orderNumber + 1 : 1001;

  // 2. Create order with sequence
  const order = new Order({
    orderNumber: nextOrderNumber,
    user: req.user._id,
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
  });

  const createdOrder = await order.save();

  // Deduct stock for ordered items
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { countInStock: -item.qty }
    });
  }

  res.status(201).json(createdOrder);
};

// @desc    Get logged in user orders (Strict Data Isolation)
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
};

// @desc    Get order by ID (Supports both MongoDB ObjectId and Sequential Order Number e.g. 1001)
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  const inputId = req.params.id.trim();
  let order;

  if (!isNaN(inputId)) {
    order = await Order.findOne({ orderNumber: Number(inputId) }).populate('user', 'name email');
  } else if (inputId.match(/^[0-9a-fA-F]{24}$/)) {
    order = await Order.findById(inputId).populate('user', 'name email');
  }

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Ensure customer can only access their own order, unless Admin
  if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }

  res.json(order);
};

// @desc    Customer Self-Cancel Order ("Change of Mind") & Restore Stock
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  const { reason } = req.body;
  const inputId = req.params.id.trim();
  let order;

  if (!isNaN(inputId)) {
    order = await Order.findOne({ orderNumber: Number(inputId) });
  } else {
    order = await Order.findById(inputId);
  }

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Verify ownership
  if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    res.status(403);
    throw new Error('Not authorized to cancel this order');
  }

  // Rule Check: Self-cancellation allowed ONLY if status is Pending Approval or Confirmed
  if (order.status !== 'Pending Approval' && order.status !== 'Confirmed') {
    res.status(400);
    throw new Error(`Order cannot be cancelled at stage: ${order.status}`);
  }

  order.status = 'Cancelled';
  order.cancellationReason = reason || 'Change of Mind';
  const updatedOrder = await order.save();

  // Automated Stock Restoration ($inc positive)
  for (const item of order.orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { countInStock: item.qty }
    });
  }

  res.json({ message: 'Order cancelled successfully and inventory restored', order: updatedOrder });
};

// ================= ADMIN CONTROLLERS =================

// @desc    Get all orders (Admin Dashboard)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  const orders = await Order.find({})
    .populate('user', 'id name email')
    .sort({ createdAt: -1 });
  res.json(orders);
};

// @desc    Update order status & add shipping tracking info (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  const { status, courierName, trackingNumber } = req.body;
  const inputId = req.params.id.trim();
  let order;

  if (!isNaN(inputId)) {
    order = await Order.findOne({ orderNumber: Number(inputId) });
  } else {
    order = await Order.findById(inputId);
  }

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // If Admin cancels order from Pending/Confirmed stage, restore stock
  if (status === 'Cancelled' && order.status !== 'Cancelled') {
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { countInStock: item.qty }
      });
    }
  }

  order.status = status || order.status;

  // Add shipment details if dispatched
  if (status === 'Out for Delivery') {
    order.shippingDetails = {
      courierName: courierName || order.shippingDetails?.courierName,
      trackingNumber: trackingNumber || order.shippingDetails?.trackingNumber,
      dispatchedAt: new Date()
    };
  }

  const updatedOrder = await order.save();
  res.json(updatedOrder);
};

export {
  addOrderItems,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus
};