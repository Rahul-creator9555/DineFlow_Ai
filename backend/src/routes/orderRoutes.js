// 1. Get Pending Orders for KDS
app.get('/api/orders/pending', async (req, res) => {
  try {
    const orders = await Order.find({ 
      overallStatus: { $in: ['in_queue', 'pending', 'preparing', 'ready'] } 
    }).sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Update Order Status (With Stock Reduction + Telegram Sync)
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const oldOrder = await Order.findById(req.params.id);

    if (!oldOrder) return res.status(404).json({ error: 'Order not found' });

    // Auto-reduce inventory stock when marked ready
    if (status === 'ready' && oldOrder.overallStatus !== 'ready') {
      for (const item of oldOrder.items) {
        if (item.menuItem) {
          const dbItem = await MenuItem.findById(item.menuItem);
          if (dbItem) {
            dbItem.stockCount = Math.max(0, dbItem.stockCount - item.quantity);
            if (dbItem.stockCount === 0) dbItem.isAvailable = false;
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

    // Send Telegram Notification if customer Chat ID exists
    if (updatedOrder && updatedOrder.customerChatId) {
      let statusMsg = '';
      if (status === 'preparing') {
        statusMsg = `👨‍🍳 *Kitchen Update!*\nYour order for *Table ${updatedOrder.tableNumber}* is now being prepared! 🔥`;
      } else if (status === 'ready') {
        statusMsg = `🔔 *Order Ready!*\nYour delicious food for *Table ${updatedOrder.tableNumber}* is READY! 🎉`;
      } else if (status === 'delivered') {
        statusMsg = `✅ *Order Completed!*\nEnjoy your meal. Bon Appétit!`;
      }

      if (statusMsg && typeof sendTelegramMessage === 'function') {
        sendTelegramMessage(updatedOrder.customerChatId, statusMsg);
      }
    }

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get Full Menu
app.get('/api/menu', async (req, res) => {
  try {
    const menu = await MenuItem.find();
    res.json(menu);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Toggle Menu Item Availability
app.patch('/api/menu/:id/availability', async (req, res) => {
  try {
    const menu = await MenuItem.findByIdAndUpdate(
      req.params.id, 
      { isAvailable: req.body.isAvailable }, 
      { new: true }
    );
    if (!menu) return res.status(404).json({ error: 'Menu item not found' });
    
    res.json(menu);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});