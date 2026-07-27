'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import SimulatedChatWidget from '@/components/SimulatedChatWidget';
import { 
  Sparkles, Gift, Lock, ShoppingBag, UtensilsCrossed, 
  Sun, Moon, Plus, Minus, CheckCircle, X, ArrowRight, UserCheck 
} from 'lucide-react';

// 🌐 Dynamic Production API Endpoint Configuration
const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_BASE_URL || 
  process.env.NEXT_PUBLIC_BACKEND_URL || 
  'https://dineflow-backend-tt3y.onrender.com';

export default function CustomerMenu() {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [perk, setPerk] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [vegFilter, setVegFilter] = useState('all');
  const [darkMode, setDarkMode] = useState(true);

  // Guest Check-in Modal States
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [tableNumber, setTableNumber] = useState('01');
  const [loading, setLoading] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);

  // Cart Checkout Modal State
  const [showCartModal, setShowCartModal] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    // 1. Check if Staff/Manager is logged in via Local Storage
    const loggedUser = localStorage.getItem('user');
    if (loggedUser) {
      try {
        const staff = JSON.parse(loggedUser);
        setCustomer({ name: `${staff.name} (${staff.role.toUpperCase()})`, visitCount: 'Staff' });
        setGuestName(staff.name);
        setGuestPhone('Staff Account');
        setShowCheckinModal(false); // 🛑 Bypass modal for Manager/Staff!
      } catch (e) {}
    } else {
      // 2. If not staff, check for Guest Session
      const savedCustomer = sessionStorage.getItem('dineflow_guest');
      const savedPerk = sessionStorage.getItem('dineflow_perk');

      if (savedCustomer) {
        try {
          const parsedCust = JSON.parse(savedCustomer);
          setCustomer(parsedCust);
          if (parsedCust.name) setGuestName(parsedCust.name);
          if (parsedCust.phone) setGuestPhone(parsedCust.phone);
          if (savedPerk) setPerk(JSON.parse(savedPerk));
          setShowCheckinModal(false);
        } catch (e) {
          setShowCheckinModal(true);
        }
      } else {
        setShowCheckinModal(true);
      }
    }

    fetch(`${API_BASE_URL}/api/menu`)
      .then((res) => res.json())
      .then((data) => setMenu(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Error loading menu:', err));
  }, []);

  const handleCheckin = async (e) => {
    e.preventDefault();
    if (!guestName || !guestPhone) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/guest-checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: guestName, phone: guestPhone }),
      });
      const data = await res.json();

      if (res.ok) {
        setCustomer(data.customer);
        setPerk(data.perk);
        sessionStorage.setItem('dineflow_guest', JSON.stringify(data.customer));
        if (data.perk) sessionStorage.setItem('dineflow_perk', JSON.stringify(data.perk));
        setShowCheckinModal(false);
      } else {
        const fallbackCust = { name: guestName, phone: guestPhone, visitCount: 1 };
        setCustomer(fallbackCust);
        sessionStorage.setItem('dineflow_guest', JSON.stringify(fallbackCust));
        setShowCheckinModal(false);
      }
    } catch (err) {
      const fallbackCust = { name: guestName, phone: guestPhone, visitCount: 1 };
      setCustomer(fallbackCust);
      sessionStorage.setItem('dineflow_guest', JSON.stringify(fallbackCust));
      setShowCheckinModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResetGuest = () => {
    sessionStorage.removeItem('dineflow_guest');
    sessionStorage.removeItem('dineflow_perk');
    setCustomer(null);
    setPerk(null);
    setGuestName('');
    setGuestPhone('');
    setShowCheckinModal(true);
  };

  // Cart Helpers
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i._id === item._id);
      if (existing) {
        return prev.map((i) => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, customization: '' }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => item._id === id ? { ...item, quantity: item.quantity + delta } : item)
        .filter((item) => item.quantity > 0)
    );
  };

  const totalCartAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Send Order to Kitchen Action
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsPlacingOrder(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: guestName || 'Guest',
          customerPhone: guestPhone || '',
          tableNumber: tableNumber || '01',
          items: cart.map((i) => ({
            menuItem: i._id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            customization: i.customization || ''
          })),
          totalAmount: totalCartAmount,
          source: 'qr_web'
        })
      });

      if (res.ok) {
        setCart([]);
        setOrderPlaced(true);
        setTimeout(() => {
          setOrderPlaced(false);
          setShowCartModal(false);
        }, 3000);
      } else {
        alert('Failed to place order. Server error.');
      }
    } catch (err) {
      console.error('Order submission failed:', err);
      alert('Failed to place order. Connection error.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const categories = [
    { key: 'all', label: 'All Items' },
    { key: 'starter', label: 'Starters' },
    { key: 'main', label: 'Main Course' },
    { key: 'roti', label: 'Breads & Rotis' },
    { key: 'beverage', label: 'Beverages' },
    { key: 'dessert', label: 'Desserts' },
  ];

  const filteredMenu = menu.filter((item) => {
    const categoryMatches = activeCategory === 'all' || item.category === activeCategory;
    const vegMatches =
      vegFilter === 'all' ||
      (vegFilter === 'veg' && item.isVeg) ||
      (vegFilter === 'nonveg' && !item.isVeg);
    return categoryMatches && vegMatches;
  });

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      darkMode ? 'bg-[#0F0F10] text-[#FFFFFF]' : 'bg-[#FDFBF7] text-[#2C221E]'
    }`}>
      <Navbar />

      {/* GUEST CHECK-IN MODAL */}
      {showCheckinModal && (
        <div className={`fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-4 ${
          darkMode ? 'bg-[#0F0F10]/90' : 'bg-[#2C221E]/30'
        }`}>
          <div className={`w-full max-w-md rounded-3xl p-8 shadow-2xl relative overflow-hidden border transition-all ${
            darkMode ? 'bg-[#1A1A1C] border-[#2E2E32]' : 'bg-white border-[#EFEBE4]'
          }`}>
            <div className="text-center mb-6">
              <div className={`inline-flex p-3.5 rounded-2xl mb-3 ${
                darkMode ? 'bg-[#E67E33]/15 text-[#E67E33]' : 'bg-[#D46D25]/10 text-[#D46D25]'
              }`}>
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className={`text-2xl font-black ${darkMode ? 'text-[#FFFFFF]' : 'text-[#2C221E]'}`}>
                Welcome to DineFlow
              </h2>
              <p className={`text-xs mt-1 ${darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'}`}>
                Enter your details to view menu & place your order!
              </p>
            </div>

            <form onSubmit={handleCheckin} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-[#FFFFFF]' : 'text-[#2C221E]'}`}>
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className={`w-full border rounded-2xl px-4 py-3 text-sm focus:outline-none transition ${
                    darkMode 
                      ? 'bg-[#0F0F10] border-[#2E2E32] text-[#FFFFFF] focus:border-[#E67E33]' 
                      : 'bg-[#F8F5F0] border-[#EFEBE4] text-[#2C221E] focus:border-[#D46D25]'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-[#FFFFFF]' : 'text-[#2C221E]'}`}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className={`w-full border rounded-2xl px-4 py-3 text-sm focus:outline-none transition ${
                    darkMode 
                      ? 'bg-[#0F0F10] border-[#2E2E32] text-[#FFFFFF] focus:border-[#E67E33]' 
                      : 'bg-[#F8F5F0] border-[#EFEBE4] text-[#2C221E] focus:border-[#D46D25]'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full font-extrabold py-3.5 rounded-2xl transition text-sm shadow-lg mt-2 text-[#FFFFFF] ${
                  darkMode
                    ? 'bg-[#E67E33] hover:bg-[#d47029] shadow-[#E67E33]/25'
                    : 'bg-[#D46D25] hover:bg-[#B85B1B] shadow-[#D46D25]/25'
                }`}
              >
                {loading ? 'Setting Session...' : 'Explore Digital Menu'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl mx-auto px-4 py-8 pb-28">
        
        {/* TOP BAR */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className={`text-xs font-extrabold uppercase tracking-wider ${
              darkMode ? 'text-[#E67E33]' : 'text-[#D46D25]'
            }`}>
              DineFlow AI Experience
            </h2>
            <p className={`text-2xl font-black ${darkMode ? 'text-[#FFFFFF]' : 'text-[#2C221E]'}`}>
              Digital Menu
            </p>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition shadow-sm border ${
              darkMode 
                ? 'bg-[#1A1A1C] border-[#2E2E32] text-[#E67E33] hover:bg-[#2E2E32]' 
                : 'bg-white border-[#EFEBE4] text-[#2C221E] hover:bg-[#F8F5F0]'
            }`}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-[#2C221E]" />}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        {/* HEADER / REWARD BANNER */}
        {customer && (
          <div className={`border rounded-3xl p-6 mb-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition ${
            darkMode ? 'bg-[#1A1A1C] border-[#2E2E32]' : 'bg-white border-[#EFEBE4]'
          }`}>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-2xl font-black ${darkMode ? 'text-[#FFFFFF]' : 'text-[#2C221E]'}`}>
                  Hello, {customer.name}! 👋
                </h1>
                {!customer.visitCount?.toString().includes('Staff') && (
                  <button 
                    onClick={handleResetGuest}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition flex items-center gap-1"
                  >
                    <UserCheck className="w-3 h-3" /> Change Guest
                  </button>
                )}
              </div>
              <p className={`text-xs mt-0.5 ${darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'}`}>
                Table {tableNumber} • Interactive QR Ordering
              </p>
            </div>

            {/* REWARD CARD */}
            {perk && (
              <div className={`p-4 rounded-2xl flex items-center gap-3 max-w-md shadow-lg animate-pulse text-[#FFFFFF] ${
                darkMode ? 'bg-[#E67E33] shadow-[#E67E33]/20' : 'bg-[#D46D25] shadow-[#D46D25]/20'
              }`}>
                <Gift className="w-8 h-8 text-amber-200 shrink-0" />
                <div>
                  <p className="text-xs font-bold">{perk.title}</p>
                  <p className="text-[11px] text-orange-100 leading-tight mt-0.5">{perk.description}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CATEGORIES & DIETARY FILTER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full md:w-auto scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition whitespace-nowrap ${
                  activeCategory === cat.key
                    ? darkMode
                      ? 'bg-[#E67E33] text-[#FFFFFF] shadow-md shadow-[#E67E33]/30'
                      : 'bg-[#D46D25] text-white shadow-md shadow-[#D46D25]/30'
                    : darkMode
                      ? 'bg-[#1A1A1C] text-[#9E9EAC] hover:text-[#FFFFFF] border border-[#2E2E32]'
                      : 'bg-white text-[#8C7B70] hover:text-[#2C221E] border border-[#EFEBE4]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className={`flex border p-1 rounded-2xl shrink-0 shadow-sm ${
            darkMode ? 'bg-[#1A1A1C] border-[#2E2E32]' : 'bg-white border-[#EFEBE4]'
          }`}>
            <button
              onClick={() => setVegFilter('all')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                vegFilter === 'all' 
                  ? darkMode ? 'bg-[#0F0F10] text-[#FFFFFF]' : 'bg-[#F8F5F0] text-[#2C221E]' 
                  : darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setVegFilter('veg')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                vegFilter === 'veg' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'
              }`}
            >
              🟢 Veg
            </button>
            <button
              onClick={() => setVegFilter('nonveg')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                vegFilter === 'nonveg' 
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                  : darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'
              }`}
            >
              🔴 Non-Veg
            </button>
          </div>
        </div>

        {/* DISHES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMenu.map((item) => {
            const inCartItem = cart.find((i) => i._id === item._id);

            return (
              <div
                key={item._id}
                className={`border rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 ${
                  darkMode ? 'bg-[#1A1A1C] border-[#2E2E32]' : 'bg-white border-[#EFEBE4]'
                } ${
                  item.isAvailable
                    ? 'hover:shadow-xl hover:-translate-y-1'
                    : 'opacity-50'
                }`}
              >
                <div>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className={`w-full h-40 object-cover rounded-2xl mb-4 border ${
                      darkMode ? 'border-[#2E2E32]' : 'border-[#EFEBE4]'
                    }`} />
                  ) : (
                    <div className={`w-full h-36 rounded-2xl mb-4 flex items-center justify-center ${
                      darkMode ? 'bg-[#0F0F10] text-[#9E9EAC]' : 'bg-[#F8F5F0] text-[#8C7B70]'
                    }`}>
                      <UtensilsCrossed className="w-8 h-8 opacity-40" />
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      item.isVeg 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {item.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
                    </span>

                    {item.isAvailable ? (
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg ${
                        darkMode ? 'bg-[#0F0F10] text-[#FFFFFF]' : 'bg-[#F8F5F0] text-[#2C221E]'
                      }`}>
                        Stock: {item.stockCount}
                      </span>
                    ) : (
                      <span className="text-[10px] bg-rose-500/10 text-rose-400 font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Sold Out
                      </span>
                    )}
                  </div>

                  <h3 className={`font-extrabold text-lg ${darkMode ? 'text-[#FFFFFF]' : 'text-[#2C221E]'}`}>
                    {item.name}
                  </h3>
                  <p className={`text-xs capitalize mt-0.5 ${darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'}`}>
                    {item.category}
                  </p>
                </div>

                <div className={`pt-4 mt-4 border-t flex justify-between items-center ${
                  darkMode ? 'border-[#2E2E32]' : 'border-[#F8F5F0]'
                }`}>
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      darkMode ? 'text-[#9E9EAC]' : 'text-[#8C7B70]'
                    }`}>Price</span>
                    <p className={`text-xl font-black ${darkMode ? 'text-[#FFFFFF]' : 'text-[#2C221E]'}`}>
                      ₹{item.price}
                    </p>
                  </div>

                  {!item.isAvailable ? (
                    <span className="text-xs text-rose-500 font-bold">Unavailable</span>
                  ) : inCartItem ? (
                    <div className={`flex items-center gap-2 border rounded-2xl p-1 ${
                      darkMode ? 'bg-[#0F0F10] border-[#2E2E32]' : 'bg-[#F8F5F0] border-[#EFEBE4]'
                    }`}>
                      <button
                        onClick={() => updateQuantity(item._id, -1)}
                        className="p-1.5 rounded-xl hover:bg-[#E67E33]/20 transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-extrabold text-xs text-[#E67E33] px-1">
                        {inCartItem.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item._id, 1)}
                        className="p-1.5 rounded-xl hover:bg-[#E67E33]/20 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(item)}
                      className={`font-extrabold text-xs px-4 py-2.5 rounded-2xl transition flex items-center gap-1.5 shadow-md text-[#FFFFFF] ${
                        darkMode
                          ? 'bg-[#E67E33] hover:bg-[#d47029] shadow-[#E67E33]/25'
                          : 'bg-[#D46D25] hover:bg-[#B85B1B] shadow-[#D46D25]/20'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" /> Add to Order
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* FLOATING BOTTOM CART BAR */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 z-40 px-4">
          <div className="max-w-2xl mx-auto bg-[#E67E33] text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-100 uppercase tracking-wider">
                {totalCartCount} Item{totalCartCount > 1 ? 's' : ''} Selected
              </p>
              <p className="text-xl font-black">₹{totalCartAmount}</p>
            </div>

            <button
              onClick={() => setShowCartModal(true)}
              className="bg-white text-[#2C221E] font-black text-xs px-6 py-3 rounded-2xl hover:bg-slate-100 transition flex items-center gap-2 shadow-md"
            >
              <ShoppingBag className="w-4 h-4 text-[#E67E33]" />
              View & Confirm Order
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {showCartModal && (
        <div className="fixed inset-0 z-50 bg-[#0F0F10]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
            darkMode ? 'bg-[#1A1A1C] border-[#2E2E32]' : 'bg-white border-[#EFEBE4]'
          }`}>
            {orderPlaced ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-3 animate-bounce" />
                <h3 className="text-xl font-black">Order Sent to Kitchen!</h3>
                <p className="text-xs text-[#9E9EAC] mt-1">Our Chef is preparing your fresh meal for Table {tableNumber}! 👨‍🍳</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#2E2E32]">
                  <h3 className="text-lg font-black">Confirm Table Order</h3>
                  <button onClick={() => setShowCartModal(false)} className="p-1 rounded-xl hover:bg-[#0F0F10]">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-1">
                  {cart.map((i) => (
                    <div key={i._id} className={`p-3 rounded-2xl border flex justify-between items-center text-xs ${
                      darkMode ? 'bg-[#0F0F10] border-[#2E2E32]' : 'bg-[#F8F5F0] border-[#EFEBE4]'
                    }`}>
                      <div>
                        <p className="font-extrabold">{i.name}</p>
                        <p className="text-[10px] text-[#9E9EAC]">₹{i.price} x {i.quantity}</p>
                      </div>
                      <span className="font-black text-[#E67E33]">₹{i.price * i.quantity}</span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handlePlaceOrder} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#9E9EAC] mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none ${
                        darkMode ? 'bg-[#0F0F10] border-[#2E2E32] text-white' : 'bg-[#F8F5F0] border-[#EFEBE4] text-[#2C221E]'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#9E9EAC] mb-1">Mobile Number</label>
                      <input
                        type="text"
                        required
                        placeholder="9876543210"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none ${
                          darkMode ? 'bg-[#0F0F10] border-[#2E2E32] text-white' : 'bg-[#F8F5F0] border-[#EFEBE4] text-[#2C221E]'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#9E9EAC] mb-1">Table Number</label>
                      <input
                        type="text"
                        required
                        placeholder="01"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none ${
                          darkMode ? 'bg-[#0F0F10] border-[#2E2E32] text-white' : 'bg-[#F8F5F0] border-[#EFEBE4] text-[#2C221E]'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#2E2E32] flex justify-between items-center text-sm font-black mb-2">
                    <span>Total Amount:</span>
                    <span className="text-[#E67E33] text-base">₹{totalCartAmount}</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isPlacingOrder}
                    className="w-full py-3.5 rounded-2xl bg-[#E67E33] hover:bg-[#d47029] text-xs font-extrabold text-white shadow-lg transition"
                  >
                    {isPlacingOrder ? 'Sending Order...' : 'Send Order to Kitchen 👨‍🍳'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* 🤖 SIMULATED AI CHAT BOT WIDGET BACKUP */}
      <SimulatedChatWidget />
    </div>
  );
}