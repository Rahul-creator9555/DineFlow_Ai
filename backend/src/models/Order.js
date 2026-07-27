import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  tableNumber: { 
    type: String, 
    default: '01' 
  },
  telegramId: { 
    type: String 
  },
  customerChatId: { 
    type: String 
  },
  customerName: { 
    type: String, 
    default: 'Customer' 
  },
  customerPhone: { 
    type: String 
  },
  items: [
    {
      menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
      name: String,
      price: Number,
      quantity: Number,
      customization: String
    }
  ],
  totalAmount: { 
    type: Number, 
    default: 0 
  },
  source: { 
    type: String, 
    default: 'qr_web' 
  },
  overallStatus: {
    type: String,
    enum: ['in_queue', 'pending', 'preparing', 'ready', 'delivered'], // 👈 Added 'in_queue' & 'pending'
    default: 'in_queue'
  }
}, { timestamps: true });

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;