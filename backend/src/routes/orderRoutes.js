// 1. Get Pending Orders for KDS
app.get('/api/orders/pending', async (req, res) => {
  const orders = await Order.find({ overallStatus: { $ne: 'served' } }).sort({ createdAt: -1 });
  res.json(orders);
});

// 2. Update Order Status
app.patch('/api/orders/:id/status', async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, { overallStatus: req.body.status }, { new: true });
  res.json(order);
});

// 3. Get Full Menu
app.get('/api/menu', async (req, res) => {
  const menu = await MenuItem.find();
  res.json(menu);
});

// 4. Toggle Menu Item Availability
app.patch('/api/menu/:id/availability', async (req, res) => {
  const menu = await MenuItem.findByIdAndUpdate(req.params.id, { isAvailable: req.body.isAvailable }, { new: true });
  res.json(menu);
});