import express from 'express';
import {
  addOrderItems,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus
} from '../controllers/order.controller.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// User Order Routes
router.route('/')
  .post(protect, addOrderItems)
  .get(protect, admin, getAllOrders);

router.route('/myorders').get(protect, getMyOrders);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/cancel').put(protect, cancelOrder);

// Admin Logistics & Status Control Route
router.route('/:id/status').put(protect, admin, updateOrderStatus);

export default router;