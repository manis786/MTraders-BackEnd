import Expense from '../models/expense.model.js';
import Order from '../models/order.model.js';

// @desc    Get all expenses & total operational expenses
// @route   GET /api/expenses
// @access  Private/Admin
const getExpenses = async (req, res) => {
  const expenses = await Expense.find({}).sort({ date: -1 });
  const totalExpenses = expenses.reduce((acc, item) => acc + item.amount, 0);
  res.json({ expenses, totalExpenses });
};

// @desc    Add new business expense
// @route   POST /api/expenses
// @access  Private/Admin
const addExpense = async (req, res) => {
  const { title, amount, category, date } = req.body;

  if (!title || amount === undefined || !category) {
    res.status(400);
    throw new Error('Please provide title, amount, and category');
  }

  const expense = new Expense({
    title,
    amount,
    category,
    date: date || Date.now()
  });

  const createdExpense = await expense.save();
  res.status(201).json(createdExpense);
};

// @desc    Delete an expense record
// @route   DELETE /api/expenses/:id
// @access  Private/Admin
const deleteExpense = async (req, res) => {
  const expense = await Expense.findById(req.params.id);

  if (expense) {
    await expense.deleteOne();
    res.json({ message: 'Expense record removed' });
  } else {
    res.status(404);
    throw new Error('Expense not found');
  }
};

// @desc    Get Financial Summary (Total Revenue, Total Expenses, Net Profit)
// @route   GET /api/expenses/analytics/profit
// @access  Private/Admin
const getFinancialSummary = async (req, res) => {
  // 1. Calculate total revenue from 'Delivered' orders
  const deliveredOrders = await Order.find({ status: 'Delivered' });
  const totalRevenue = deliveredOrders.reduce((acc, order) => acc + order.totalPrice, 0);

  // 2. Calculate total expenses
  const expenses = await Expense.find({});
  const totalExpenses = expenses.reduce((acc, item) => acc + item.amount, 0);

  // 3. Calculate Net Profit
  const netProfit = totalRevenue - totalExpenses;

  res.json({
    totalRevenue,
    totalExpenses,
    netProfit,
    deliveredOrdersCount: deliveredOrders.length
  });
};

export {
  getExpenses,
  addExpense,
  deleteExpense,
  getFinancialSummary
};