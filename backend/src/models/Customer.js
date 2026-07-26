import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  visitCount: { type: Number, default: 1 },
  lastVisit: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Customer', customerSchema);