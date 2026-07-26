import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MenuItem from '../models/MenuItem.js';

dotenv.config();

const sampleMenu = [
  // 🥗 STARTERS
  { name: 'Paneer Tikka', category: 'starter', price: 280, isVeg: true, isAvailable: true, stockCount: 25 },
  { name: 'Hara Bhara Kebab', category: 'starter', price: 220, isVeg: true, isAvailable: true, stockCount: 18 },
  { name: 'Crispy Corn', category: 'starter', price: 190, isVeg: true, isAvailable: true, stockCount: 20 },
  { name: 'Chicken Tikka', category: 'starter', price: 340, isVeg: false, isAvailable: true, stockCount: 15 },
  { name: 'Chilli Chicken', category: 'starter', price: 320, isVeg: false, isAvailable: true, stockCount: 12 },

  // 🥘 MAIN COURSE
  { name: 'Butter Paneer Masala', category: 'main', price: 320, isVeg: true, isAvailable: true, stockCount: 30 },
  { name: 'Dal Makhani', category: 'main', price: 260, isVeg: true, isAvailable: true, stockCount: 40 },
  { name: 'Kadhai Paneer', category: 'main', price: 310, isVeg: true, isAvailable: true, stockCount: 22 },
  { name: 'Mix Veg Curry', category: 'main', price: 240, isVeg: true, isAvailable: false, stockCount: 0 },
  { name: 'Butter Chicken', category: 'main', price: 420, isVeg: false, isAvailable: true, stockCount: 20 },
  { name: 'Chicken Biryani', category: 'main', price: 380, isVeg: false, isAvailable: true, stockCount: 25 },
  { name: 'Mutton Rogan Josh', category: 'main', price: 490, isVeg: false, isAvailable: true, stockCount: 10 },

  // 🫓 BREADS & ROTIS
  { name: 'Butter Naan', category: 'roti', price: 60, isVeg: true, isAvailable: true, stockCount: 100 },
  { name: 'Garlic Naan', category: 'roti', price: 80, isVeg: true, isAvailable: true, stockCount: 80 },
  { name: 'Tandoori Roti', category: 'roti', price: 30, isVeg: true, isAvailable: true, stockCount: 150 },
  { name: 'Lachha Paratha', category: 'roti', price: 70, isVeg: true, isAvailable: true, stockCount: 50 },

  // 🍹 BEVERAGES
  { name: 'Fresh Lime Soda', category: 'beverage', price: 90, isVeg: true, isAvailable: true, stockCount: 50 },
  { name: 'Cold Coffee', category: 'beverage', price: 140, isVeg: true, isAvailable: true, stockCount: 30 },
  { name: 'Mango Lassi', category: 'beverage', price: 110, isVeg: true, isAvailable: true, stockCount: 25 },
  { name: 'Masala Chai', category: 'beverage', price: 40, isVeg: true, isAvailable: true, stockCount: 60 },

  // 🍨 DESSERTS
  { name: 'Gulab Jamun (2 pcs)', category: 'dessert', price: 100, isVeg: true, isAvailable: true, stockCount: 40 },
  { name: 'Sizzling Brownie with Ice Cream', category: 'dessert', price: 220, isVeg: true, isAvailable: true, stockCount: 15 },
  { name: 'Rasmalai', category: 'dessert', price: 130, isVeg: true, isAvailable: false, stockCount: 0 }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await MenuItem.deleteMany({});
    await MenuItem.insertMany(sampleMenu);
    console.log('🎉 Menu categories cleaned up successfully!');
    process.exit();
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedDB();