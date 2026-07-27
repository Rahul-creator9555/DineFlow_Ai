'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { socket } from '@/lib/socket';
import { 
  ChefHat, Flame, CheckCircle2, Mic, MessageSquare, 
  Sun, Moon, CheckCheck, Sparkles, Filter, Package, ChevronUp, ChevronDown, Eye, EyeOff 
} from 'lucide-react';

// 🌐 Dynamic Production API Endpoint Configuration
const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_BASE_URL || 
  process.env.NEXT_PUBLIC_BACKEND_URL || 
  'https://dineflow-backend.onrender.com';

export default function KitchenDashboard() {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'inventory'
  const [darkMode, setDarkMode] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isConnected, setIsConnected] = useState(false);

  // Play audio chime for new live incoming orders
  const playNewOrderSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.log('Audio playback prevented or unsupported');
    }
  };

  const fetchMenu = () => {
    fetch(`${API_BASE_URL}/api/menu`)
      .then((res) => res.json())
      .then((data) => setMenuItems(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Error fetching menu:', err));
  };

  useEffect(() => {
    socket.connect();
    socket.emit('join:room', 'kitchen');

    setIsConnected(socket.connected);

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    // Fetch initial active orders
    fetch(`${API_BASE_URL}/api/orders/pending`)
      .then((res) => res.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Error fetching orders:', err));

    fetchMenu();

    // Real-time listener for incoming orders
    socket.on('order:new', (newOrder) => {
      playNewOrderSound();
      setOrders((prev) => [newOrder, ...prev]);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('order:new');
      socket.disconnect();
    };
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (newStatus === 'delivered') {
        // Clear from screen once served
        setOrders((prev) => prev.filter((o) => o._id !== orderId));
      } else {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, overallStatus: newStatus } : o))
        );
      }
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  // Chef Action 1: Toggle Dish Availability (In Stock / Sold Out)
  const toggleItemAvailability = async (item) => {
    try {
      await fetch(`${API_BASE_URL}/api/menu/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, isAvailable: !item.isAvailable }),
      });
      fetchMenu();
    } catch (err) {
      console.error('Error toggling availability:', err);
    }
  };

  // Chef Action 2: Adjust Dish Stock Quantity (+/-)
  const adjustStock = async (item, delta) => {
    const newStock = Math.max(0, (item.stockCount || 0) + delta);
    try {
      await fetch(`${API_BASE_URL}/api/menu/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, stockCount: newStock, isAvailable: newStock > 0 }),
      });
      fetchMenu();
    } catch (err) {
      console.error('Error updating stock:', err);
    }
  };

  // Filtered orders list based on status chips
  const filteredOrders = orders.filter((order) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'in_queue') return order.overallStatus === 'in_queue' || order.overallStatus === 'pending';
    return order.overallStatus === statusFilter;
  });

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      darkMode ? 'bg-[#0F0F10] text-[#FFFFFF]' : 'bg-[#FDFBF7] text-[#2C221E]'
    }`}>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2.5">
              <ChefHat className={`w-8 h-8 ${darkMode ? 'text-[#E67E33]' : 'text-[#D46D25]'}`} />
              <h1 className="text-3xl font-black tracking-tight">Kitchen Display & Stock Controls</h1>
            </div>
            <p className={`text-xs mt-1 ${darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'}`}>
              Live Order Stream • Real-time Chef Dish Control Active
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* VIEW MODE SWITCHER (Live Tickets vs Dish Stock Controls) */}
            <div className={`flex border rounded-2xl p-1 ${darkMode ? 'bg-[#1A1A1C] border-[#2E2E32]' : 'bg-white border-[#EFEBE4]'}`}>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'orders' 
                    ? 'bg-[#E67E33] text-white shadow-md' 
                    : darkMode ? 'text-[#9E9EAC] hover:text-white' : 'text-[#8C7B70] hover:text-[#2C221E]'
                }`}
              >
                🔥 Live Orders ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'inventory' 
                    ? 'bg-[#E67E33] text-white shadow-md' 
                    : darkMode ? 'text-[#9E9EAC] hover:text-white' : 'text-[#8C7B70] hover:text-[#2C221E]'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                Dish Stock Controls
              </button>
            </div>

            {/* Live Socket Badge */}
            <div className={`px-3 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
              darkMode ? 'bg-[#1A1A1C] border-[#2E2E32]' : 'bg-white border-[#EFEBE4]'
            }`}>
              <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
            </div>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-sm border ${
                darkMode 
                  ? 'bg-[#1A1A1C] border-[#2E2E32] text-[#E67E33] hover:bg-[#2E2E32]' 
                  : 'bg-white border-[#EFEBE4] text-[#2C221E] hover:bg-[#F8F5F0]'
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-[#2C221E]" />}
            </button>
          </div>
        </div>

        {/* TAB 1: LIVE ORDERS STREAM */}
        {activeTab === 'orders' ? (
          <>
            {/* STATUS FILTER TABS */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
              <span className={`text-xs font-bold mr-2 flex items-center gap-1 shrink-0 ${darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'}`}>
                <Filter className="w-3.5 h-3.5" /> Filter:
              </span>
              {[
                { key: 'all', label: `All Active (${orders.length})` },
                { key: 'in_queue', label: `In Queue (${orders.filter(o => o.overallStatus === 'in_queue' || o.overallStatus === 'pending').length})` },
                { key: 'preparing', label: `Cooking (${orders.filter(o => o.overallStatus === 'preparing').length})` },
                { key: 'ready', label: `Ready (${orders.filter(o => o.overallStatus === 'ready').length})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition whitespace-nowrap border ${
                    statusFilter === tab.key
                      ? darkMode
                        ? 'bg-[#E67E33] text-white border-[#E67E33]'
                        : 'bg-[#D46D25] text-white border-[#D46D25]'
                      : darkMode
                        ? 'bg-[#1A1A1C] text-[#9E9EAC] border-[#2E2E32] hover:text-white'
                        : 'bg-white text-[#8C7B70] border-[#EFEBE4] hover:text-[#2C221E]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ORDERS GRID */}
            {filteredOrders.length === 0 ? (
              <div className={`text-center py-20 rounded-3xl border ${
                darkMode ? 'bg-[#1A1A1C] border-[#2E2E32]' : 'bg-white border-[#EFEBE4]'
              }`}>
                <ChefHat className={`w-16 h-16 mx-auto mb-4 opacity-30 ${darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'}`} />
                <h3 className="text-lg font-bold">Kitchen is Quiet</h3>
                <p className={`text-xs mt-1 ${darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'}`}>
                  No orders found matching the selected filter.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrders.map((order) => {
                  const isVoice = order.source && order.source.includes('voice');
                  const status = order.overallStatus || 'in_queue';
                  const isPreparing = status === 'preparing';
                  const isReady = status === 'ready';

                  return (
                    <div
                      key={order._id}
                      className={`border rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all ${
                        darkMode ? 'bg-[#1A1A1C] border-[#2E2E32]' : 'bg-white border-[#EFEBE4]'
                      } ${
                        isPreparing 
                          ? 'border-amber-500/50 shadow-amber-500/5' 
                          : isReady 
                            ? 'border-emerald-500/50 shadow-emerald-500/5' 
                            : ''
                      }`}
                    >
                      <div>
                        {/* TICKET HEADER */}
                        <div className="flex justify-between items-start mb-4 pb-3 border-b border-dashed border-slate-700/30">
                          <div>
                            <span className="text-2xl font-black">
                              Table #{order.tableNumber || '01'}
                            </span>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                                isReady 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : isPreparing 
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              }`}>
                                {status === 'in_queue' || status === 'pending' ? 'In Queue 🟡' : status === 'preparing' ? 'Preparing 👨‍🍳' : 'Ready 🔔'}
                              </span>
                            </div>
                          </div>

                          <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 border ${
                            isVoice 
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>
                            {isVoice ? <Mic className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                            {isVoice ? 'Voice Note' : 'Text Bot'}
                          </span>
                        </div>

                        {/* DISH ITEMS LIST */}
                        <div className="space-y-2.5 mb-6">
                          {order.items && order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-2xl border flex justify-between items-start gap-2 ${
                                darkMode ? 'bg-[#0F0F10] border-[#2E2E32]' : 'bg-[#F8F5F0] border-[#EFEBE4]'
                              }`}
                            >
                              <div className="flex-1">
                                <p className="font-extrabold text-sm">{item.name}</p>
                                {item.customization && (
                                  <p className="text-[11px] text-amber-500 font-semibold italic mt-0.5 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 shrink-0" /> {item.customization}
                                  </p>
                                )}
                              </div>
                              <span className={`px-2.5 py-1 rounded-xl text-xs font-black shrink-0 ${
                                darkMode ? 'bg-[#1A1A1C] text-[#E67E33]' : 'bg-white text-[#D46D25]'
                              }`}>
                                x{item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ACTION CONTROLS */}
                      <div className={`pt-4 border-t flex gap-2 ${darkMode ? 'border-[#2E2E32]' : 'border-[#EFEBE4]'}`}>
                        <button
                          onClick={() => updateOrderStatus(order._id, 'preparing')}
                          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1 ${
                            isPreparing
                              ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                              : darkMode
                                ? 'bg-[#0F0F10] hover:bg-[#2E2E32] text-amber-400 border border-[#2E2E32]'
                                : 'bg-[#F8F5F0] hover:bg-[#EFEBE4] text-amber-600 border border-[#EFEBE4]'
                          }`}
                        >
                          <Flame className="w-3.5 h-3.5" />
                          {isPreparing ? 'Cooking...' : 'Start Cooking'}
                        </button>

                        <button
                          onClick={() => updateOrderStatus(order._id, 'ready')}
                          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1 ${
                            isReady
                              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                              : darkMode
                                ? 'bg-[#0F0F10] hover:bg-[#2E2E32] text-emerald-400 border border-[#2E2E32]'
                                : 'bg-[#F8F5F0] hover:bg-[#EFEBE4] text-emerald-600 border border-[#EFEBE4]'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isReady ? 'Ready!' : 'Mark Ready'}
                        </button>

                        <button
                          onClick={() => updateOrderStatus(order._id, 'delivered')}
                          className="px-3 py-2.5 rounded-xl font-bold text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition flex items-center justify-center"
                          title="Mark Served & Clear Ticket"
                        >
                          <CheckCheck className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* TAB 2: CHEF DISH STOCK CONTROLS */
          <div className={`border rounded-3xl p-6 shadow-xl ${
            darkMode ? 'bg-[#1A1A1C] border-[#2E2E32]' : 'bg-white border-[#EFEBE4]'
          }`}>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#2E2E32]">
              <div>
                <h2 className="text-xl font-black flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#E67E33]" /> Chef Dish Inventory & Availability Control
                </h2>
                <p className={`text-xs mt-1 ${darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'}`}>
                  Update stock quantities directly or mark dishes as Sold Out / In Stock.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map((item) => (
                <div
                  key={item._id}
                  className={`p-4 rounded-2xl border flex justify-between items-center transition ${
                    darkMode ? 'bg-[#0F0F10] border-[#2E2E32]' : 'bg-[#F8F5F0] border-[#EFEBE4]'
                  }`}
                >
                  <div className="flex-1 mr-3">
                    <p className="font-extrabold text-sm leading-tight">{item.name}</p>
                    <p className={`text-[11px] capitalize mt-0.5 ${darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'}`}>
                      Category: {item.category}
                    </p>

                    {/* Quantity Controls (+/-) */}
                    <div className="flex items-center gap-2 mt-3">
                      <span className={`text-[11px] font-bold ${darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'}`}>
                        Stock:
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => adjustStock(item, -1)}
                          className={`p-1 rounded-lg transition ${
                            darkMode ? 'bg-[#1A1A1C] hover:bg-[#2E2E32] text-[#9E9EAC]' : 'bg-white hover:bg-[#EFEBE4] text-[#8C7B70]'
                          }`}
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-extrabold text-xs text-[#E67E33] w-6 text-center">
                          {item.stockCount}
                        </span>
                        <button
                          onClick={() => adjustStock(item, 1)}
                          className={`p-1 rounded-lg transition ${
                            darkMode ? 'bg-[#1A1A1C] hover:bg-[#2E2E32] text-[#9E9EAC]' : 'bg-white hover:bg-[#EFEBE4] text-[#8C7B70]'
                          }`}
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Availability Toggle Button */}
                  <button
                    onClick={() => toggleItemAvailability(item)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 shrink-0 ${
                      item.isAvailable
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                    }`}
                  >
                    {item.isAvailable ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {item.isAvailable ? 'In Stock' : 'Sold Out'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}