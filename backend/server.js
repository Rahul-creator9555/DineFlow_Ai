import dotenv from 'dotenv';
dotenv.config(); // Must be called before importing sub-routes/services that read process.env

import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import passport from 'passport';
import { connectDB } from './src/config/db.js';
import { initSocket, getIO } from './src/socket/socketHandler.js';
import { initTelegramBot, sendTelegramMessage } from './src/services/telegramBot.js';
import MenuItem from './src/models/MenuItem.js';
import Order from './src/models/Order.js';

// Import authRoutes AFTER dotenv has been initialized
import authRoutes, { processCustomerLoyalty } from './src/routes/authRoutes.js';

const app = express();
const server = http.createServer(app);

// 🛡️ Middleware Pipeline
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(passport.initialize());

// Startup Debug Check
console.log('--------------------------------------------------');
console.log('🔍 GOOGLE_CLIENT_ID Status:', process.env.GOOGLE_CLIENT_ID ? '✅ Loaded Successfully' : '❌ UNDEFINED / MISSING');
console.log('--------------------------------------------------');

// Table Reservation Schema
const reservationSchema = new mongoose.Schema({
  customerName: String,
  customerChatId: String,
  bookingDetails: String,
  guestCount: Number,
  bookingDate: String,
  bookingTime: String,
  eventType: String,
  status: { type: String, default: 'confirmed' }
}, { timestamps: true });

const Reservation = mongoose.models.Reservation || mongoose.model('Reservation', reservationSchema);

// Word-to-Number Dictionary for Voice/Text Order Parsing
const wordToNum = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10
};

// 🤖 SIMULATED AI VOICE/CHAT BOT ROUTE (LOYALTY + DIRECT KDS ORDER PLACEMENT)
app.post('/api/auth/simulated-bot', async (req, res) => {
  try {
    const { name, phone, message, tableNumber } = req.body;

    // 1. Loyalty Check-In Only (When no chat message is passed)
    if (name && phone && !message) {
      const { customer, perk } = await processCustomerLoyalty(name, phone);
      
      let replyText = `👋 Welcome ${customer.name}! You have visited us ${customer.visitCount} times.`;
      if (perk) {
        replyText += `\n\n🎉 ${perk.title}\n${perk.description}`;
      } else {
        replyText += `\n\nEnjoy your dining experience at DineFlow!`;
      }

      return res.json({ reply: replyText, perk, customer });
    }

    // 2. Process Voice/Chat Order Command via AI NLP Parsing
    if (message) {
      const lowerMsg = message.toLowerCase();

      // 📍 Dynamic Table Number Extraction (e.g., "at table 3", "table 05", "t3")
      let detectedTable = tableNumber || '01';
      const tableMatch = lowerMsg.match(/(?:table|tbl|t)\s*(\d+)/i);
      if (tableMatch) {
        detectedTable = tableMatch[1].padStart(2, '0');
      }

      // Fetch active menu items from Database
      const menuItems = await MenuItem.find({ isAvailable: true });
      let matchedItems = [];
      let totalAmount = 0;

      // 🛒 Quantity & Item Extraction (Handles digits like "2" and words like "two")
      menuItems.forEach((item) => {
        const itemName = item.name.toLowerCase();

        if (lowerMsg.includes(itemName)) {
          let quantity = 1;

          // Check for numeric digits before item name (e.g., "2 butter naan")
          const digitMatch = lowerMsg.match(new RegExp(`(\\d+)\\s*${itemName}`));
          if (digitMatch) {
            quantity = parseInt(digitMatch[1]);
          } else {
            // Check for words before item name (e.g., "two butter naan")
            const wordMatch = lowerMsg.match(new RegExp(`\\b(one|two|three|four|five|six|seven|eight|nine|ten)\\b\\s*${itemName}`));
            if (wordMatch && wordToNum[wordMatch[1]]) {
              quantity = wordToNum[wordMatch[1]];
            }
          }

          matchedItems.push({
            menuItem: item._id,
            name: item.name,
            price: item.price,
            quantity: quantity,
            customization: 'AI Voice/Chat Bot Order'
          });
          totalAmount += item.price * quantity;
        }
      });

      // If valid items are found -> Automatically Place Order in Kitchen!
      if (matchedItems.length > 0) {
        const newOrder = await Order.create({
          customerName: name || 'Voice Guest',
          customerPhone: phone || '9999999999',
          tableNumber: detectedTable,
          items: matchedItems,
          totalAmount: totalAmount,
          source: 'ai_voice_chat',
          overallStatus: 'in_queue'
        });

        // Live Push Notification to Kitchen Display System (KDS)
        try {
          const io = getIO();
          if (io) io.to('kitchen').emit('order:new', newOrder);
        } catch (e) {
          console.log('⚠️ Socket notification warning:', e.message);
        }

        const itemSummary = matchedItems.map(i => `${i.quantity}x ${i.name}`).join(', ');
        
        return res.json({
          reply: `✅ Order Placed via AI!\n\n📝 Items: ${itemSummary}\n💰 Total: ₹${totalAmount}\n📍 Table: ${detectedTable}\n\nSent directly to Kitchen Display System (KDS)! 👨‍🍳`,
          orderCreated: true
        });
      }

      // Fallback response if no items match
      return res.json({
        reply: `🤖 DineFlow AI: I received "${message}". Try saying: "Order 2 Butter Naan at table 3"`
      });
    }

    res.json({ reply: 'DineFlow AI Bot: Enter details or speak to place an order.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🛒 Menu Routes
app.get('/api/menu', async (req, res) => {
  try {
    const menu = await MenuItem.find();
    res.json(menu);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/menu', async (req, res) => {
  try {
    const newItem = new MenuItem(req.body);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/menu/:id', async (req, res) => {
  try {
    const updatedItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/menu/:id', async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ⚡ WEB QR DIRECT ORDER CREATION API
app.post('/api/orders', async (req, res) => {
  try {
    const { customerName, customerPhone, tableNumber, items, totalAmount, source } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in order' });
    }

    const newOrder = await Order.create({
      customerName: customerName || 'Guest',
      customerPhone: customerPhone || '',
      tableNumber: tableNumber || '01',
      items,
      totalAmount,
      source: source || 'qr_web',
      overallStatus: 'in_queue'
    });

    try {
      const io = getIO();
      if (io) io.to('kitchen').emit('order:new', newOrder);
    } catch (e) {
      console.log('⚠️ Socket notification warning:', e.message);
    }

    res.status(201).json(newOrder);
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: err.message });
  }
});

// 📊 MANAGER DASHBOARD ANALYTICS & RESERVATIONS API
app.get('/api/stats', async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayOrders = await Order.find({ createdAt: { $gte: todayStart } });
    const todayRevenue = todayOrders.reduce((sum, ord) => sum + (ord.totalAmount || 0), 0);

    const activeOrders = await Order.find({ 
      overallStatus: { $in: ['in_queue', 'pending', 'preparing', 'ready'] } 
    });
    const occupiedTables = new Set(activeOrders.map(o => o.tableNumber)).size;

    res.json({ todayRevenue, occupiedTables });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reservations', async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({ createdAt: -1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👨‍🍳 KITCHEN ORDERS ROUTES
app.get('/api/orders/pending', async (req, res) => {
  try {
    const activeOrders = await Order.find({
      overallStatus: { $in: ['in_queue', 'pending', 'preparing', 'ready'] }
    }).sort({ createdAt: -1 });

    res.json(activeOrders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔄 LIVE STATUS UPDATE
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const oldOrder = await Order.findById(req.params.id);

    if (!oldOrder) return res.status(404).json({ error: 'Order not found' });

    if (status === 'ready' && oldOrder.overallStatus !== 'ready') {
      for (const item of oldOrder.items) {
        if (item.menuItem) {
          const dbItem = await MenuItem.findById(item.menuItem);
          if (dbItem) {
            dbItem.stockCount = Math.max(0, dbItem.stockCount - item.quantity);
            if (dbItem.stockCount === 0) {
              dbItem.isAvailable = false;
            }
            await dbItem.save();
          }
        }
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { overallStatus: status },
      { new: true }
    );

    if (updatedOrder && updatedOrder.customerChatId) {
      let statusMsg = '';
      if (status === 'preparing') {
        statusMsg = `👨‍🍳 *Kitchen Update!*\nYour order for *Table ${updatedOrder.tableNumber}* is now being prepared by the Chef! 🔥`;
      } else if (status === 'ready') {
        statusMsg = `🔔 *Order Ready!*\nYour delicious food for *Table ${updatedOrder.tableNumber}* is READY! Fresh & hot. Bon Appétit! 🎉`;
      } else if (status === 'delivered') {
        statusMsg = `✅ *Order Completed!*\nEnjoy your meal. Type or tap 'Pay Bill' when you are finished.`;
      }

      if (statusMsg) {
        sendTelegramMessage(updatedOrder.customerChatId, statusMsg);
      }
    }

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🚀 Register Auth Routes
app.use('/api/auth', authRoutes);

// App Base & Services
connectDB();
initSocket(server);
initTelegramBot();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🔥 DineFlow Engine listening on port ${PORT}`));