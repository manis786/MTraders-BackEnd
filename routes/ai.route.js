import express from 'express';
import { handleAdminQuery } from '../controllers/ai.controller.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin AI Query Endpoint
router.post('/admin-query', protect, admin, handleAdminQuery);

export default router;