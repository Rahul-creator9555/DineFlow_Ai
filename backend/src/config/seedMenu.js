import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MenuItem from '../models/MenuItem.js';

dotenv.config();

const sampleMenu = [
  {
    name: 'Paneer Tikka',
    category: 'starter',
    price: 260,
    stockCount: 40,
    isVeg: true,
    isAvailable: true,
    imageUrl: '/images/paneer-tikka.jpg'
  },
  {
    name: 'Samosa',
    category: 'starter',
    price: 60,
    stockCount: 50,
    isVeg: true,
    isAvailable: true,
    imageUrl: '/images/samosa.jpg'
  },
  {
    name: 'Chicken Tikka',
    category: 'starter',
    price: 320,
    stockCount: 35,
    isVeg: false,
    isAvailable: true,
    imageUrl: '/images/chicken-tikka.jpg'
  },
  {
    name: 'French Fries',
    category: 'starter',
    price: 140,
    stockCount: 60,
    isVeg: true,
    isAvailable: true,
    imageUrl: '/images/fries.jpg'
  },
  {
    name: 'Butter Chicken',
    category: 'main',
    price: 380,
    stockCount: 30,
    isVeg: false,
    isAvailable: true,
    imageUrl: '/images/butter-chicken.jpg'
  },
  {
    name: 'Chicken Biryani',
    category: 'main',
    price: 340,
    stockCount: 30,
    isVeg: false,
    isAvailable: true,
    imageUrl: '/images/biryani.jpg'
  },
  {
    name: 'Paneer Butter Masala',
    category: 'main',
    price: 290,
    stockCount: 45,
    isVeg: true,
    isAvailable: true,
    imageUrl: '/images/paneer-masala.jpg'
  },
  {
    name: 'Dal Makhani',
    category: 'main',
    price: 240,
    stockCount: 50,
    isVeg: true,
    isAvailable: true,
    imageUrl: '/images/dal-makhani.jpg'
  },
  {
    name: 'Butter Naan',
    category: 'roti',
    price: 50,
    stockCount: 100,
    isVeg: true,
    isAvailable: true,
    imageUrl: '/images/butter-naan.jpg'
  },
  {
    name: 'Mango Lassi',
    category: 'beverage',
    price: 120,
    stockCount: 25,
    isVeg: true,
    isAvailable: true,
    imageUrl: '/images/mango-lassi.jpg'
  },
  {
    name: 'Cold Coffee',
    category: 'beverage',
    price: 150,
    stockCount: 30,
    isVeg: true,
    isAvailable: true,
    imageUrl: '/images/cold-coffee.jpg'
  },
  {
    name: 'Gulab Jamun',
    category: 'dessert',
    price: 110,
    stockCount: 20,
    isVeg: true,
    isAvailable: true,
    imageUrl: '/images/gulab-jamun.jpg'
  }
];

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dineflow')
  .then(async () => {
    await MenuItem.deleteMany({});
    await MenuItem.insertMany(sampleMenu);
    console.log('✅ Menu successfully seeded with LOCAL images!');
    process.exit();
  })
  .catch((err) => {
    console.error('❌ Error seeding menu:', err);
    process.exit(1);
  });