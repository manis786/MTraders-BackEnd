import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  orderItems: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    qty: { type: Number, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true }
  }],
  shippingAddress: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, default: '' },
    phone: { type: String, required: true }
  },
  paymentMethod: { type: String, required: true, default: 'Cash on Delivery' },
  
  // Price Breakdown matching frontend payload
  itemsPrice: { type: Number, required: true, default: 0 },
  shippingPrice: { type: Number, required: true, default: 0 },
  taxPrice: { type: Number, required: true, default: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
  
  // Order Workflow & Status Control
  status: { 
    type: String, 
    enum: ['Pending Approval', 'Confirmed', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Pending Approval'
  },
  deliveryStatus: {
  type: String,
  enum: ['Pending', 'Processing', 'Shipped', 'Delivered'],
  default: 'Pending'
},
  cancellationReason: { type: String, default: null },

  // Logistics & Tracking Details (Filled by Admin on Dispatch)
  shippingDetails: {
    courierName: { type: String, default: null },
    trackingNumber: { type: String, default: null },
    dispatchedAt: { type: Date, default: null }
  }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;