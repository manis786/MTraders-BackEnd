import express from 'express';
import {
  getExpenses,
  addExpense,
  deleteExpense,
  getFinancialSummary
} from '../controllers/expense.controller.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, admin, getExpenses)
  .post(protect, admin, addExpense);

router.route('/analytics/profit').get(protect, admin, getFinancialSummary);
router.route('/:id').delete(protect, admin, deleteExpense);

export default router;