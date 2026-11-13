import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';

// Route Imports
import userRoutes from './routes/user.route.js';
import productRoutes from './routes/product.route.js';
import orderRoutes from './routes/order.route.js';
import expenseRoutes from './routes/expense.route.js';

// Middleware Imports
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Load Environment Variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

app.use(express.json());

// CORS Configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Rate Limiting for Security
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/', limiter);

// Register API Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/expenses', expenseRoutes);

app.get('/', (req, res) => {
  res.send('Memon Traders Backend API is running successfully...');
});

// Register Error Handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Memon Traders backend server running on port ${PORT}`);
});