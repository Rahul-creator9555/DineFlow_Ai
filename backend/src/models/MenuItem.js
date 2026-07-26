import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['starter', 'main', 'roti', 'beverage', 'dessert']
  },
  price: { type: Number, required: true },
  isVeg: { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true },
  stockCount: { type: Number, default: 50 },
  imageUrl: { type: String, default: '' } // 👈 Added Image URL Field
}, { timestamps: true });

export default mongoose.model('MenuItem', menuItemSchema);