import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: String,
  price: Number,
  quantity: { type: Number, required: true, min: 1 },
  customization: { type: String, default: '' },
  status: {
    type: String,
    enum: ['placed', 'preparing', 'ready', 'served'],
    default: 'placed'
  }
});

const orderSchema = new mongoose.Schema({
  tableNumber: { type: Number, required: true },
  customerName: { type: String, default: 'Guest' },
  customerPhone: { type: String, default: '' },
  telegramId: { type: String },
  items: [orderItemSchema],
  overallStatus: {
    type: String,
    enum: ['placed', 'preparing', 'ready', 'served', 'cancelled'],
    default: 'placed'
  },
  source: { type: String, enum: ['telegram_text', 'telegram_voice', 'qr_web'], default: 'qr_web' },
  rawTranscript: { type: String, default: '' },
  totalAmount: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);