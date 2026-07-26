'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Plus, Edit3, Trash2, Image as ImageIcon, Sparkles, Check, X } from 'lucide-react';

export default function ManagerDashboard() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'starter',
    price: '',
    stockCount: 50,
    isVeg: true,
    isAvailable: true,
    imageUrl: ''
  });

  const fetchMenu = () => {
    fetch('http://localhost:5000/api/menu')
      .then((res) => res.json())
      .then((data) => {
        setMenu(data);
        setLoading(false);
      })
      .catch((err) => console.error('Error fetching menu:', err));
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        category: 'starter',
        price: '',
        stockCount: 50,
        isVeg: true,
        isAvailable: true,
        imageUrl: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingItem
      ? `http://localhost:5000/api/menu/${editingItem._id}`
      : 'http://localhost:5000/api/menu';
    const method = editingItem ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        fetchMenu();
      }
    } catch (err) {
      alert('Failed to save item');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this dish?')) return;
    try {
      await fetch(`http://localhost:5000/api/menu/${id}`, { method: 'DELETE' });
      fetchMenu();
    } catch (err) {
      alert('Failed to delete item');
    }
  };

  const toggleAvailability = async (item) => {
    try {
      await fetch(`http://localhost:5000/api/menu/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !item.isAvailable })
      });
      fetchMenu();
    } catch (err) {
      alert('Error updating status');
    }
  };

  return (
    <div className="min-h-screen bg-[#140d07] text-[#f5e6d3] font-sans selection:bg-[#e3c18d] selection:text-[#140d07]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* HEADER & QUICK STATS */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-[#f5e6d3] tracking-tight">Manager Dashboard</h1>
            <p className="text-xs text-[#a38f78] mt-1">Manage restaurant inventory, pricing, images & AI forecasts.</p>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="bg-[#e3c18d] hover:bg-[#d4b07b] text-[#140d07] font-extrabold text-xs px-5 py-3 rounded-2xl transition flex items-center gap-2 shadow-lg shadow-[#e3c18d]/10"
          >
            <Plus className="w-4 h-4" /> Add New Dish
          </button>
        </div>

        {/* ANALYTICS & AI FORECAST WIDGET */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#241a12] border border-[#3b2b1f] p-5 rounded-2xl shadow-md">
            <p className="text-xs text-[#a38f78] font-bold uppercase tracking-wider">Today's Total Revenue</p>
            <p className="text-2xl font-black text-[#e3c18d] mt-1">₹14,250</p>
          </div>
          <div className="bg-[#241a12] border border-[#3b2b1f] p-5 rounded-2xl shadow-md">
            <p className="text-xs text-[#a38f78] font-bold uppercase tracking-wider">Live Tables Occupied</p>
            <p className="text-2xl font-black text-[#f5e6d3] mt-1">6 / 10 Tables Active</p>
          </div>
          <div className="bg-[#241a12] border border-[#3b2b1f] p-5 rounded-2xl shadow-md border-l-4 border-l-[#e3c18d]">
            <p className="text-xs text-[#e3c18d] font-extrabold uppercase flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> AI Inventory Forecast
            </p>
            <p className="text-xs text-[#d4c2ad] mt-1">
              High demand predicted for <span className="font-bold text-[#f5e6d3]">Paneer Tikka</span> tonight. Recommended re-stock: 15 units.
            </p>
          </div>
        </div>

        {/* DISHES MANAGEMENT TABLE */}
        <div className="bg-[#1a120b] border border-[#3b2b1f] rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-[#3b2b1f] flex justify-between items-center">
            <h2 className="text-lg font-bold text-[#f5e6d3]">Active Menu Items ({menu.length})</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#d4c2ad]">
              <thead className="bg-[#241a12] text-[#a38f78] uppercase font-bold text-[10px] tracking-wider border-b border-[#3b2b1f]">
                <tr>
                  <th className="p-4">Item</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2b1f16]">
                {menu.map((item) => (
                  <tr key={item._id} className="hover:bg-[#241a12]/50 transition">
                    <td className="p-4 flex items-center gap-3">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded-xl border border-[#3b2b1f]" />
                      ) : (
                        <div className="w-10 h-10 bg-[#241a12] border border-[#3b2b1f] rounded-xl flex items-center justify-center text-[#a38f78]">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-sm text-[#f5e6d3]">{item.name}</p>
                        <span className={`text-[10px] font-semibold ${item.isVeg ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {item.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 capitalize font-medium text-[#a38f78]">{item.category}</td>
                    <td className="p-4 font-black text-[#e3c18d] text-sm">₹{item.price}</td>
                    <td className="p-4 font-semibold">{item.stockCount} units</td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleAvailability(item)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold transition border ${
                          item.isAvailable
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50'
                            : 'bg-rose-950/60 text-rose-300 border-rose-800/50'
                        }`}
                      >
                        {item.isAvailable ? 'In Stock' : 'Sold Out'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="p-2 bg-[#241a12] hover:bg-[#3b2b1f] text-[#e3c18d] rounded-xl border border-[#3b2b1f] transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-xl border border-rose-800/40 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ADD / EDIT DISH MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#140d07]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#1a120b] border border-[#3b2b1f] rounded-3xl p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6 border-b border-[#3b2b1f] pb-4">
              <h3 className="text-xl font-black text-[#f5e6d3]">
                {editingItem ? '✏️ Edit Menu Item' : '➕ Add New Menu Item'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[#a38f78] hover:text-[#f5e6d3]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#a38f78] mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paneer Butter Masala"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#241a12] border border-[#3b2b1f] rounded-xl px-4 py-2.5 text-sm text-[#f5e6d3] focus:outline-none focus:border-[#e3c18d]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#a38f78] mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#241a12] border border-[#3b2b1f] rounded-xl px-4 py-2.5 text-sm text-[#f5e6d3] focus:outline-none focus:border-[#e3c18d]"
                  >
                    <option value="starter">Starters</option>
                    <option value="main">Main Course</option>
                    <option value="roti">Breads & Rotis</option>
                    <option value="beverage">Beverages</option>
                    <option value="dessert">Desserts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#a38f78] mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="290"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-[#241a12] border border-[#3b2b1f] rounded-xl px-4 py-2.5 text-sm text-[#f5e6d3] focus:outline-none focus:border-[#e3c18d]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#a38f78] mb-1">Stock Count</label>
                  <input
                    type="number"
                    required
                    value={formData.stockCount}
                    onChange={(e) => setFormData({ ...formData, stockCount: Number(e.target.value) })}
                    className="w-full bg-[#241a12] border border-[#3b2b1f] rounded-xl px-4 py-2.5 text-sm text-[#f5e6d3] focus:outline-none focus:border-[#e3c18d]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#a38f78] mb-1">Dietary Type</label>
                  <select
                    value={formData.isVeg ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isVeg: e.target.value === 'true' })}
                    className="w-full bg-[#241a12] border border-[#3b2b1f] rounded-xl px-4 py-2.5 text-sm text-[#f5e6d3] focus:outline-none focus:border-[#e3c18d]"
                  >
                    <option value="true">🟢 Vegetarian</option>
                    <option value="false">🔴 Non-Vegetarian</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a38f78] mb-1">Image URL (Unsplash / Web link)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full bg-[#241a12] border border-[#3b2b1f] rounded-xl px-4 py-2.5 text-sm text-[#f5e6d3] focus:outline-none focus:border-[#e3c18d]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#e3c18d] hover:bg-[#d4b07b] text-[#140d07] font-black py-3 rounded-xl transition text-sm mt-4 shadow-lg shadow-[#e3c18d]/10"
              >
                {editingItem ? 'Save Changes' : 'Add Item to Menu'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}