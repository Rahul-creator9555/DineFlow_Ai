'use client';

import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import {
  Plus, Edit3, Trash2, Image as ImageIcon, Sparkles, X,
  Search, LayoutGrid, List, AlertTriangle, TrendingUp, Package,
  ChevronUp, ChevronDown, Eye, EyeOff, Sun, Moon, Calendar, Users
} from 'lucide-react';

// 🌐 Dynamic Production API Base Endpoint Configuration
const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_BASE_URL || 
  process.env.NEXT_PUBLIC_BACKEND_URL || 
  'https://dineflow-backend-tt3y.onrender.com';

export default function ManagerDashboard() {
  const [menu, setMenu] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState({ todayRevenue: 0, occupiedTables: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showReservationsModal, setShowReservationsModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterVeg, setFilterVeg] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [darkMode, setDarkMode] = useState(true);

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

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch Menu, Reservations & Real-time Stats dynamically from Live Backend
  const fetchDashboardData = () => {
    Promise.all([
      fetch(`${API_BASE_URL}/api/menu`).then((res) => res.json()).catch(() => []),
      fetch(`${API_BASE_URL}/api/reservations`).then((res) => res.json()).catch(() => []),
      fetch(`${API_BASE_URL}/api/stats`).then((res) => res.json()).catch(() => ({ todayRevenue: 0, occupiedTables: 0 }))
    ])
      .then(([menuData, resData, statsData]) => {
        setMenu(Array.isArray(menuData) ? menuData : []);
        setReservations(Array.isArray(resData) ? resData : []);
        if (statsData) setStats(statsData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching dashboard data:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Derived filtered menu data
  const filteredMenu = useMemo(() => {
    return menu.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      const matchesVeg =
        filterVeg === 'all' ||
        (filterVeg === 'veg' && item.isVeg) ||
        (filterVeg === 'nonveg' && !item.isVeg);
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'available' && item.isAvailable) ||
        (filterStatus === 'soldout' && !item.isAvailable);
      const matchesLowStock = !showLowStockOnly || item.stockCount <= 10;

      return matchesSearch && matchesCategory && matchesVeg && matchesStatus && matchesLowStock;
    });
  }, [menu, searchQuery, filterCategory, filterVeg, filterStatus, showLowStockOnly]);

  const lowStockItems = useMemo(() => menu.filter((i) => i.stockCount <= 10), [menu]);
  const availableCount = useMemo(() => menu.filter((i) => i.isAvailable).length, [menu]);

  // Dynamic AI Inventory Forecast Item (lowest stock item or highest priority)
  const aiForecastItem = useMemo(() => {
    if (lowStockItems.length > 0) return lowStockItems[0];
    return menu[0] || null;
  }, [lowStockItems, menu]);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({ ...item });
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
      ? `${API_BASE_URL}/api/menu/${editingItem._id}`
      : `${API_BASE_URL}/api/menu`;
    const method = editingItem ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        fetchDashboardData();
        showToast(editingItem ? 'Dish updated successfully' : 'New dish added to menu');
      }
    } catch (err) {
      showToast('Failed to save item', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/api/menu/${id}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      fetchDashboardData();
      showToast('Dish removed from menu');
    } catch (err) {
      showToast('Failed to delete item', 'error');
    }
  };

  const toggleAvailability = async (item) => {
    try {
      await fetch(`${API_BASE_URL}/api/menu/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, isAvailable: !item.isAvailable })
      });
      fetchDashboardData();
      showToast(item.isAvailable ? 'Marked as Sold Out' : 'Back in stock');
    } catch (err) {
      showToast('Error updating status', 'error');
    }
  };

  const adjustStock = async (item, delta) => {
    const newStock = Math.max(0, (item.stockCount || 0) + delta);
    try {
      await fetch(`${API_BASE_URL}/api/menu/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, stockCount: newStock, isAvailable: newStock > 0 })
      });
      fetchDashboardData();
    } catch (err) {
      showToast('Failed to update stock', 'error');
    }
  };

  const getStockColor = (count) => {
    if (count <= 5) return 'text-rose-400';
    if (count <= 15) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const getStockBar = (count) => {
    const pct = Math.min(100, (count / 50) * 100);
    let color = 'bg-emerald-500';
    if (count <= 5) color = 'bg-rose-500';
    else if (count <= 15) color = 'bg-amber-500';
    return { pct, color };
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      darkMode ? 'bg-[#0F0F10] text-[#FFFFFF]' : 'bg-[#FDFBF7] text-[#2C221E]'
    }`}>
      <Navbar />

      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-2xl shadow-2xl border text-sm font-bold animate-in slide-in-from-right duration-300 ${
          toast.type === 'error'
            ? 'bg-rose-950 border-rose-800 text-rose-200'
            : darkMode
              ? 'bg-[#1A1A1C] border-[#E67E33] text-[#FFFFFF]'
              : 'bg-white border-[#D46D25] text-[#2C221E]'
        }`}>
          {toast.message}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* HEADER & LIGHT/DARK TOGGLE */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              Manager Dashboard
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                darkMode ? 'bg-[#E67E33]/15 text-[#E67E33] border-[#E67E33]/30' : 'bg-[#D46D25]/10 text-[#D46D25] border-[#D46D25]/20'
              }`}>
                Live Engine
              </span>
            </h1>
            <p className={`text-xs mt-1.5 ${darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'}`}>
              Real-time Inventory • Live Telegram Bookings • AI Demand Forecasting
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition shadow-sm border ${
                darkMode 
                  ? 'bg-[#1A1A1C] border-[#2E2E32] text-[#E67E33] hover:bg-[#2E2E32]' 
                  : 'bg-white border-[#EFEBE4] text-[#2C221E] hover:bg-[#F8F5F0]'
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-[#2C221E]" />}
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>

            <button
              onClick={() => handleOpenModal()}
              className={`group font-extrabold text-sm px-6 py-3.5 rounded-2xl transition-all flex items-center gap-2 shadow-lg text-[#FFFFFF] ${
                darkMode 
                  ? 'bg-[#E67E33] hover:bg-[#d47029] shadow-[#E67E33]/25' 
                  : 'bg-[#D46D25] hover:bg-[#B85B1B] shadow-[#D46D25]/25'
              }`}
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              Add New Dish
            </button>
          </div>
        </div>

        {/* 📊 DYNAMIC ANALYTICS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Dynamic Revenue */}
          <div className={`p-5 rounded-3xl border transition-all ${
            darkMode ? 'bg-[#1A1A1C] border-[#2E2E32]' : 'bg-white border-[#EFEBE4]'
          }`}>
            <div className="flex items-center justify-between">
              <p className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'}`}>
                Today's Revenue
              </p>
              <TrendingUp className={`w-4 h-4 ${darkMode ? 'text-[#E67E33]' : 'text-[#D46D25]'}`} />
            </div>
            <p className="text-2xl font-black mt-2">₹{stats.todayRevenue || 0}</p>
            <p className="text-[11px] text-emerald-500 font-semibold mt-1">Updated live from orders</p>
          </div>

          {/* Card 2: Dynamic Live Occupied Tables */}
          <div className={`p-5 rounded-3xl border transition-all ${
            darkMode ? 'bg-[#1A1A1C] border-[#2E2E32]' : 'bg-white border-[#EFEBE4]'
          }`}>
            <p className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'}`}>
              Live Occupied Tables
            </p>
            <p className="text-2xl font-black mt-2">
              {stats.occupiedTables || 0} <span className={`text-base ${darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'}`}>/ 10 Tables</span>
            </p>
            <div className={`w-full h-1.5 rounded-full mt-3 overflow-hidden ${darkMode ? 'bg-[#0F0F10]' : 'bg-[#F8F5F0]'}`}>
              <div 
                className={`h-full rounded-full transition-all ${darkMode ? 'bg-[#E67E33]' : 'bg-[#D46D25]'}`} 
                style={{ width: `${Math.min(100, ((stats.occupiedTables || 0) / 10) * 100)}%` }} 
              />
            </div>
          </div>

          {/* Card 3: Dynamic Telegram Bookings Button */}
          <div 
            onClick={() => setShowReservationsModal(true)}
            className={`p-5 rounded-3xl border cursor-pointer hover:scale-[1.02] transition ${
              darkMode ? 'bg-[#1A1A1C] border-[#E67E33]/40' : 'bg-white border-[#D46D25]/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-[#E67E33]' : 'text-[#D46D25]'}`}>
                Telegram Bookings
              </p>
              <Calendar className={`w-4 h-4 ${darkMode ? 'text-[#E67E33]' : 'text-[#D46D25]'}`} />
            </div>
            <p className="text-2xl font-black mt-2">{reservations.length} Reserved</p>
            <p className="text-[11px] text-amber-500 font-bold mt-1">Tap to View List ➔</p>
          </div>

          {/* Card 4: Dynamic AI Inventory Forecast */}
          <div className={`p-5 rounded-3xl border border-l-4 relative overflow-hidden ${
            darkMode 
              ? 'bg-[#1A1A1C] border-[#2E2E32] border-l-[#E67E33]' 
              : 'bg-white border-[#EFEBE4] border-l-[#D46D25]'
          }`}>
            <p className={`text-[11px] font-extrabold uppercase flex items-center gap-1.5 ${darkMode ? 'text-[#E67E33]' : 'text-[#D46D25]'}`}>
              <Sparkles className="w-3.5 h-3.5" /> AI Inventory Forecast
            </p>
            {aiForecastItem ? (
              <p className={`text-xs mt-2 leading-relaxed ${darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'}`}>
                High demand for <span className={`font-bold ${darkMode ? 'text-[#FFFFFF]' : 'text-[#2C221E]'}`}>{aiForecastItem.name}</span>.
                Restock <span className={`font-bold ${darkMode ? 'text-[#E67E33]' : 'text-[#D46D25]'}`}>15 units</span> recommended.
              </p>
            ) : (
              <p className="text-xs mt-2">All stock levels healthy.</p>
            )}
          </div>
        </div>

        {/* LOW STOCK ALERT */}
        {lowStockItems.length > 0 && (
          <div className="mb-6 bg-rose-950/40 border border-rose-800/50 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-rose-300">
                {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} running low on stock
              </p>
              <p className="text-xs text-rose-200/70 mt-0.5">
                {lowStockItems.slice(0, 3).map(i => i.name).join(', ')}
                {lowStockItems.length > 3 && ` +${lowStockItems.length - 3} more`}
              </p>
            </div>
            <button
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className="text-xs font-bold text-rose-300 hover:text-rose-200 underline underline-offset-2"
            >
              {showLowStockOnly ? 'Show All' : 'Filter Low Stock'}
            </button>
          </div>
        )}

        {/* FILTERS + VIEW TOGGLE */}
        <div className={`border rounded-2xl p-4 mb-6 sticky top-4 z-20 backdrop-blur-md ${
          darkMode ? 'bg-[#1A1A1C]/90 border-[#2E2E32]' : 'bg-white/90 border-[#EFEBE4]'
        }`}>
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'}`} />
              <input
                type="text"
                placeholder="Search dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition ${
                  darkMode 
                    ? 'bg-[#0F0F10] border-[#2E2E32] text-[#FFFFFF] focus:border-[#E67E33]' 
                    : 'bg-[#F8F5F0] border-[#EFEBE4] text-[#2C221E] focus:border-[#D46D25]'
                }`}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className={`border rounded-xl px-3 py-2.5 text-xs focus:outline-none ${
                  darkMode ? 'bg-[#0F0F10] border-[#2E2E32] text-[#FFFFFF]' : 'bg-[#F8F5F0] border-[#EFEBE4] text-[#2C221E]'
                }`}
              >
                <option value="all">All Categories</option>
                <option value="starter">Starters</option>
                <option value="main">Main Course</option>
                <option value="roti">Breads & Rotis</option>
                <option value="beverage">Beverages</option>
                <option value="dessert">Desserts</option>
              </select>

              <select
                value={filterVeg}
                onChange={(e) => setFilterVeg(e.target.value)}
                className={`border rounded-xl px-3 py-2.5 text-xs focus:outline-none ${
                  darkMode ? 'bg-[#0F0F10] border-[#2E2E32] text-[#FFFFFF]' : 'bg-[#F8F5F0] border-[#EFEBE4] text-[#2C221E]'
                }`}
              >
                <option value="all">Veg & Non-Veg</option>
                <option value="veg">Vegetarian</option>
                <option value="nonveg">Non-Vegetarian</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`border rounded-xl px-3 py-2.5 text-xs focus:outline-none ${
                  darkMode ? 'bg-[#0F0F10] border-[#2E2E32] text-[#FFFFFF]' : 'bg-[#F8F5F0] border-[#EFEBE4] text-[#2C221E]'
                }`}
              >
                <option value="all">All Status</option>
                <option value="available">In Stock</option>
                <option value="soldout">Sold Out</option>
              </select>
            </div>

            {/* View Toggle */}
            <div className={`flex border rounded-xl p-1 ${
              darkMode ? 'bg-[#0F0F10] border-[#2E2E32]' : 'bg-[#F8F5F0] border-[#EFEBE4]'
            }`}>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition ${
                  viewMode === 'table' 
                    ? darkMode ? 'bg-[#E67E33] text-white' : 'bg-[#D46D25] text-white' 
                    : darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition ${
                  viewMode === 'grid' 
                    ? darkMode ? 'bg-[#E67E33] text-white' : 'bg-[#D46D25] text-white' 
                    : darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* MENU CONTENT TABLE / GRID */}
        <div className={`border rounded-3xl overflow-hidden shadow-2xl ${
          darkMode ? 'bg-[#1A1A1C] border-[#2E2E32]' : 'bg-white border-[#EFEBE4]'
        }`}>
          <div className={`p-5 border-b flex justify-between items-center ${darkMode ? 'border-[#2E2E32]' : 'border-[#EFEBE4]'}`}>
            <h2 className="text-base font-bold">
              Menu Items List
              <span className={`ml-2 text-xs font-medium ${darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'}`}>
                ({filteredMenu.length}{filteredMenu.length !== menu.length ? ` of ${menu.length}` : ''})
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className={`inline-block w-8 h-8 border-2 border-t-transparent rounded-full animate-spin ${
                darkMode ? 'border-[#E67E33]' : 'border-[#D46D25]'
              }`} />
              <p className={`text-sm mt-4 ${darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'}`}>Fetching database records...</p>
            </div>
          ) : filteredMenu.length === 0 ? (
            <div className="p-16 text-center">
              <Package className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-[#2E2E32]' : 'text-[#EFEBE4]'}`} />
              <p className={`font-medium ${darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'}`}>
                No menu items match your search/filter parameters
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterCategory('all');
                  setFilterVeg('all');
                  setFilterStatus('all');
                  setShowLowStockOnly(false);
                }}
                className={`mt-3 text-sm hover:underline font-bold ${darkMode ? 'text-[#E67E33]' : 'text-[#D46D25]'}`}
              >
                Clear Filters
              </button>
            </div>
          ) : viewMode === 'table' ? (
            /* TABLE VIEW */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`uppercase font-bold text-[10px] tracking-wider border-b ${
                  darkMode ? 'bg-[#0F0F10] text-[#9E9EAC] border-[#2E2E32]' : 'bg-[#F8F5F0] text-[#8C7B70] border-[#EFEBE4]'
                }`}>
                  <tr>
                    <th className="p-4">Item</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-[#2E2E32]' : 'divide-[#F8F5F0]'}`}>
                  {filteredMenu.map((item) => {
                    const stockBar = getStockBar(item.stockCount);
                    return (
                      <tr key={item._id} className={`transition group ${darkMode ? 'hover:bg-[#2E2E32]/40' : 'hover:bg-[#F8F5F0]/60'}`}>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className={`w-11 h-11 object-cover rounded-xl border ${darkMode ? 'border-[#2E2E32]' : 'border-[#EFEBE4]'}`}
                              />
                            ) : (
                              <div className={`w-11 h-11 border rounded-xl flex items-center justify-center ${
                                darkMode ? 'bg-[#0F0F10] border-[#2E2E32] text-[#9E9EAC]' : 'bg-[#F8F5F0] border-[#EFEBE4] text-[#8C7B70]'
                              }`}>
                                <ImageIcon className="w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-sm">{item.name}</p>
                              <span className={`text-[10px] font-semibold ${item.isVeg ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {item.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className={`p-4 capitalize font-medium ${darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'}`}>{item.category}</td>
                        <td className="p-4 font-black text-sm">₹{item.price}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => adjustStock(item, -1)}
                                className={`p-1 rounded-lg transition ${
                                  darkMode ? 'bg-[#0F0F10] hover:bg-[#2E2E32] text-[#9E9EAC]' : 'bg-[#F8F5F0] hover:bg-[#EFEBE4] text-[#8C7B70]'
                                }`}
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                              <span className={`font-bold w-8 text-center ${getStockColor(item.stockCount)}`}>
                                {item.stockCount}
                              </span>
                              <button
                                onClick={() => adjustStock(item, 1)}
                                className={`p-1 rounded-lg transition ${
                                  darkMode ? 'bg-[#0F0F10] hover:bg-[#2E2E32] text-[#9E9EAC]' : 'bg-[#F8F5F0] hover:bg-[#EFEBE4] text-[#8C7B70]'
                                }`}
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className={`w-16 h-1.5 rounded-full overflow-hidden hidden sm:block ${darkMode ? 'bg-[#0F0F10]' : 'bg-[#F8F5F0]'}`}>
                              <div
                                className={`h-full rounded-full transition-all ${stockBar.color}`}
                                style={{ width: `${stockBar.pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => toggleAvailability(item)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition border flex items-center gap-1.5 ${
                              item.isAvailable
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                            }`}
                          >
                            {item.isAvailable ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            {item.isAvailable ? 'In Stock' : 'Sold Out'}
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal(item)}
                              className={`p-2 rounded-xl border transition ${
                                darkMode ? 'bg-[#0F0F10] hover:bg-[#2E2E32] text-[#E67E33] border-[#2E2E32]' : 'bg-[#F8F5F0] hover:bg-[#EFEBE4] text-[#D46D25] border-[#EFEBE4]'
                              }`}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(item)}
                              className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl border border-rose-500/20 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* GRID / CARD VIEW */
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMenu.map((item) => {
                const stockBar = getStockBar(item.stockCount);
                return (
                  <div
                    key={item._id}
                    className={`border rounded-2xl overflow-hidden transition-all group ${
                      darkMode ? 'bg-[#0F0F10] border-[#2E2E32]' : 'bg-[#F8F5F0] border-[#EFEBE4]'
                    }`}
                  >
                    <div className="relative h-36">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${darkMode ? 'bg-[#1A1A1C] text-[#9E9EAC]' : 'bg-white text-[#8C7B70]'}`}>
                          <ImageIcon className="w-12 h-12" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-md ${
                          item.isVeg ? 'bg-emerald-950/80 text-emerald-300' : 'bg-rose-950/80 text-rose-300'
                        }`}>
                          {item.isVeg ? '🟢 VEG' : '🔴 NON-VEG'}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <button
                          onClick={() => toggleAvailability(item)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-md border ${
                            item.isAvailable
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50'
                              : 'bg-rose-950/80 text-rose-300 border-rose-700/50'
                          }`}
                        >
                          {item.isAvailable ? 'Available' : 'Sold Out'}
                        </button>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h3 className="font-bold text-sm leading-tight">{item.name}</h3>
                          <p className={`text-[11px] capitalize mt-0.5 ${darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'}`}>{item.category}</p>
                        </div>
                        <p className="font-black text-base">₹{item.price}</p>
                      </div>

                      <div className="mt-3">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className={darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'}>Stock</span>
                          <span className={`font-bold ${getStockColor(item.stockCount)}`}>{item.stockCount} units</span>
                        </div>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-[#1A1A1C]' : 'bg-white'}`}>
                          <div className={`h-full rounded-full ${stockBar.color}`} style={{ width: `${stockBar.pct}%` }} />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-4">
                        <button
                          onClick={() => handleOpenModal(item)}
                          className={`flex-1 py-2 text-xs font-bold rounded-xl border transition flex items-center justify-center gap-1.5 ${
                            darkMode ? 'bg-[#1A1A1C] hover:bg-[#2E2E32] text-[#E67E33] border-[#2E2E32]' : 'bg-white hover:bg-[#EFEBE4] text-[#D46D25] border-[#EFEBE4]'
                          }`}
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(item)}
                          className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl border border-rose-500/20 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* 📅 TELEGRAM TABLE RESERVATIONS MODAL */}
      {showReservationsModal && (
        <div className="fixed inset-0 z-50 bg-[#0F0F10]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl rounded-3xl p-6 shadow-2xl border ${darkMode ? 'bg-[#1A1A1C] border-[#2E2E32]' : 'bg-white border-[#EFEBE4]'}`}>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#2E2E32]">
              <div className="flex items-center gap-2">
                <Calendar className="w-6 h-6 text-[#E67E33]" />
                <h3 className="text-xl font-black">Telegram Table Bookings</h3>
              </div>
              <button onClick={() => setShowReservationsModal(false)} className="p-1.5 rounded-xl hover:bg-[#0F0F10]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {reservations.length === 0 ? (
              <p className="text-center py-8 text-sm text-[#9E9EAC]">No table bookings received yet from Telegram.</p>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {reservations.map((res, i) => (
                  <div key={i} className={`p-4 rounded-2xl border ${darkMode ? 'bg-[#0F0F10] border-[#2E2E32]' : 'bg-[#F8F5F0] border-[#EFEBE4]'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-extrabold text-sm">{res.customerName}</p>
                        <p className="text-xs text-[#E67E33] font-semibold mt-1">"{res.bookingDetails}"</p>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {(res.status || 'CONFIRMED').toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className={`fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-4 ${
          darkMode ? 'bg-[#0F0F10]/80' : 'bg-[#2C221E]/30'
        }`}>
          <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto border ${
            darkMode ? 'bg-[#1A1A1C] border-[#2E2E32]' : 'bg-white border-[#EFEBE4]'
          }`}>
            <div className={`flex justify-between items-center mb-6 border-b pb-4 ${darkMode ? 'border-[#2E2E32]' : 'border-[#EFEBE4]'}`}>
              <h3 className="text-xl font-black">
                {editingItem ? 'Edit Dish Details' : 'Add New Dish'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className={`p-1.5 rounded-xl transition ${
                  darkMode ? 'text-[#9E9EAC] hover:text-white hover:bg-[#0F0F10]' : 'text-[#8C7B70] hover:text-[#2C221E] hover:bg-[#F8F5F0]'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formData.imageUrl && (
                <div className={`relative h-32 rounded-2xl overflow-hidden border ${darkMode ? 'border-[#2E2E32]' : 'border-[#EFEBE4]'}`}>
                  <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'}`}>Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paneer Tikka"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition ${
                    darkMode 
                      ? 'bg-[#0F0F10] border-[#2E2E32] text-[#FFFFFF] focus:border-[#E67E33]' 
                      : 'bg-[#F8F5F0] border-[#EFEBE4] text-[#2C221E] focus:border-[#D46D25]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'}`}>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none ${
                      darkMode ? 'bg-[#0F0F10] border-[#2E2E32] text-[#FFFFFF]' : 'bg-[#F8F5F0] border-[#EFEBE4] text-[#2C221E]'
                    }`}
                  >
                    <option value="starter">Starters</option>
                    <option value="main">Main Course</option>
                    <option value="roti">Breads & Rotis</option>
                    <option value="beverage">Beverages</option>
                    <option value="dessert">Desserts</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'}`}>Price (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="290"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none ${
                      darkMode 
                        ? 'bg-[#0F0F10] border-[#2E2E32] text-[#FFFFFF]' 
                        : 'bg-[#F8F5F0] border-[#EFEBE4] text-[#2C221E]'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'}`}>Stock Count</label>
                  <input
                    type="number"
                    required
                    value={formData.stockCount}
                    onChange={(e) => setFormData({ ...formData, stockCount: Number(e.target.value) })}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none ${
                      darkMode 
                        ? 'bg-[#0F0F10] border-[#2E2E32] text-[#FFFFFF]' 
                        : 'bg-[#F8F5F0] border-[#EFEBE4] text-[#2C221E]'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'}`}>Dietary Type</label>
                  <select
                    value={formData.isVeg ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isVeg: e.target.value === 'true' })}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none ${
                      darkMode ? 'bg-[#0F0F10] border-[#2E2E32] text-[#FFFFFF]' : 'bg-[#F8F5F0] border-[#EFEBE4] text-[#2C221E]'
                    }`}
                  >
                    <option value="true">🟢 Vegetarian</option>
                    <option value="false">🔴 Non-Vegetarian</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'}`}>Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none ${
                    darkMode 
                      ? 'bg-[#0F0F10] border-[#2E2E32] text-[#FFFFFF]' 
                      : 'bg-[#F8F5F0] border-[#EFEBE4] text-[#2C221E]'
                  }`}
                />
              </div>

              <button
                type="submit"
                className={`w-full font-extrabold py-3.5 rounded-2xl transition text-sm mt-2 shadow-lg text-white ${
                  darkMode ? 'bg-[#E67E33] hover:bg-[#d47029] shadow-[#E67E33]/25' : 'bg-[#D46D25] hover:bg-[#B85B1B] shadow-[#D46D25]/25'
                }`}
              >
                {editingItem ? 'Save Changes' : 'Add to Menu'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteConfirm && (
        <div className={`fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-4 ${
          darkMode ? 'bg-[#0F0F10]/80' : 'bg-[#2C221E]/30'
        }`}>
          <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center border ${
            darkMode ? 'bg-[#1A1A1C] border-[#2E2E32]' : 'bg-white border-[#EFEBE4]'
          }`}>
            <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
              <Trash2 className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="text-lg font-black">Delete Dish?</h3>
            <p className={`text-sm mt-2 ${darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'}`}>
              Are you sure you want to remove <span className="font-semibold">{deleteConfirm.name}</span> from the menu?
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirm(null)}
                className={`flex-1 py-2.5 font-bold rounded-xl border transition text-sm ${
                  darkMode ? 'bg-[#0F0F10] hover:bg-[#2E2E32] text-[#9E9EAC] border-[#2E2E32]' : 'bg-[#F8F5F0] hover:bg-[#EFEBE4] text-[#8C7B70] border-[#EFEBE4]'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm._id)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}