import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import Expense from '../models/expense.model.js';

// @desc    Admin AI Assistant Query Handler
// @route   POST /api/ai/admin-query
// @access  Private/Admin
const handleAdminQuery = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ reply: 'Please provide a query message.' });
    }

    const query = message.toLowerCase();
    let reply = '';

    // 1. Check for Order Lookup (e.g., "track order 1001" or just "1001")
    const orderMatch = query.match(/(?:order|track|#)?\s*(\d+)/i) || query.match(/([0-9a-fA-F]{24})/);
    if (query.includes('order') || query.includes('track') || (orderMatch && query.length < 15)) {
      const searchId = orderMatch ? orderMatch[1] : null;
      if (searchId) {
        let order;
        if (!isNaN(searchId)) {
          order = await Order.findOne({ orderNumber: Number(searchId) }).populate('user', 'name email');
        } else if (searchId.match(/^[0-9a-fA-F]{24}$/)) {
          order = await Order.findById(searchId).populate('user', 'name email');
        }

        if (order) {
          reply = `📦 **Order Found (MT-${order.orderNumber || order._id})**:\n- Status: ${order.status} | Delivery: ${order.deliveryStatus}\n- Total Bill: Rs. ${order.totalPrice.toLocaleString()}\n- Items: ${order.orderItems.map(i => `${i.name} (x${i.qty})`).join(', ')}`;
          return res.json({ reply });
        } else {
          reply = `❌ Order with ID/Number "${searchId}" was not found in the database.`;
          return res.json({ reply });
        }
      }
    }

    // 2. Total Revenue & Sales Check
    if (query.includes('sales') || query.includes('revenue') || query.includes('income')) {
      const orders = await Order.find({});
      const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
      const confirmedOrders = orders.filter(o => o.status === 'Confirmed' || o.status === 'Delivered').length;
      
      reply = `💰 **Financial & Sales Overview**:\n- Total Revenue Generated: Rs. ${totalRevenue.toLocaleString()}\n- Total Orders Received: ${orders.length}\n- Confirmed/Completed Orders: ${confirmedOrders}`;
      return res.json({ reply });
    }

    // 3. Low Stock & Inventory Check
    if (query.includes('stock') || query.includes('product') || query.includes('inventory') || query.includes('low')) {
      const products = await Product.find({});
      const lowStock = products.filter(p => Number(p.countInStock) <= 3);

      if (query.includes('low') || query.includes('khatam')) {
        reply = `⚠️ **Low Stock Alert**:\nThere are ${lowStock.length} products with 3 or fewer units left:\n${lowStock.map(p => `• ${p.name} (${p.countInStock} left)`).join('\n') || 'None! All items have healthy stock.'}`;
      } else {
        reply = `📦 **Inventory Summary**:\n- Total Products in Catalog: ${products.length}\n- Low Stock Items (&le; 3 units): ${lowStock.length}`;
      }
      return res.json({ reply });
    }

    // 4. Expenses Check
    if (query.includes('expense') || query.includes('kharcha') || query.includes('cost')) {
      const expenses = await Expense.find({});
      const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      
      reply = `📊 **Expense Overview**:\n- Total Recorded Expenses: Rs. ${totalExpenses.toLocaleString()}\n- Total Expense Entries: ${expenses.length}`;
      return res.json({ reply });
    }

    // Default Fallback
    reply = `🤖 Hello Anis bhai! Main Memon Traders ka Admin AI Assistant hoon. Aap mujhse yeh pooch sakte hain:\n- "Aaj ki total sales kitni hain?"\n- "Low stock products dikhao"\n- "Track order 1001"\n- "Total expenses kitne hain?"`;
    res.json({ reply });

  } catch (error) {
    res.status(500).json({ reply: 'AI Agent error: ' + error.message });
  }
};

export { handleAdminQuery };