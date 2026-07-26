'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Sparkles, Gift, Lock, ShoppingBag, UtensilsCrossed, Sun, Moon } from 'lucide-react';

export default function CustomerMenu() {
  const [menu, setMenu] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [perk, setPerk] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [vegFilter, setVegFilter] = useState('all');
  const [darkMode, setDarkMode] = useState(false); // 🌙 Theme Toggle State

  // Guest Check-in Modal States
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    const savedCustomer = sessionStorage.getItem('dineflow_guest');
    const savedPerk = sessionStorage.getItem('dineflow_perk');
    if (savedCustomer) {
      setCustomer(JSON.parse(savedCustomer));
      if (savedPerk) setPerk(JSON.parse(savedPerk));
      setShowModal(false);
    }

    fetch('http://localhost:5000/api/menu')
      .then((res) => res.json())
      .then((data) => setMenu(data))
      .catch((err) => console.error('Error loading menu:', err));
  }, []);

  const handleCheckin = async (e) => {
    e.preventDefault();
    if (!guestName || !guestPhone) return;

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/guest-checkin', {
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
        setShowModal(false);
      }
    } catch (err) {
      alert('Check-in failed. Please try again.');
    } finally {
      setLoading(false);
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
      darkMode ? 'bg-[#0B1437] text-white' : 'bg-[#F4F7FE] text-[#2B3674]'
    }`}>
      <Navbar />

      {/* GUEST CHECK-IN MODAL */}
      {showModal && (
        <div className={`fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-4 ${
          darkMode ? 'bg-[#0B1437]/70' : 'bg-[#2B3674]/30'
        }`}>
          <div className={`w-full max-w-md rounded-3xl p-8 shadow-2xl relative overflow-hidden border transition-all ${
            darkMode ? 'bg-[#111C44] border-[#1B254B]' : 'bg-white border-[#E9EDF7]'
          }`}>
            <div className="text-center mb-6">
              <div className="inline-flex p-3.5 bg-[#4318FF]/10 text-[#4318FF] rounded-2xl mb-3">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-[#2B3674]'}`}>Welcome to DineFlow</h2>
              <p className="text-xs text-[#A3AED0] mt-1">Enter your details to view menu & unlock instant rewards!</p>
            </div>

            <form onSubmit={handleCheckin} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-[#2B3674]'}`}>Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className={`w-full border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#4318FF] transition ${
                    darkMode ? 'bg-[#0B1437] border-[#1B254B] text-white' : 'bg-[#F4F7FE] border-[#E9EDF7] text-[#2B3674]'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-[#2B3674]'}`}>Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className={`w-full border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#4318FF] transition ${
                    darkMode ? 'bg-[#0B1437] border-[#1B254B] text-white' : 'bg-[#F4F7FE] border-[#E9EDF7] text-[#2B3674]'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#4318FF] hover:bg-[#3311CC] text-white font-extrabold py-3.5 rounded-2xl transition text-sm shadow-lg shadow-[#4318FF]/30 mt-2"
              >
                {loading ? 'Unlocking Perks...' : 'Explore Menu'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* TOP BAR WITH LIGHT/DARK MODE TOGGLE */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xs font-extrabold text-[#4318FF] uppercase tracking-wider">DineFlow AI Experience</h2>
            <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-[#2B3674]'}`}>Digital Menu</p>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition shadow-sm border ${
              darkMode 
                ? 'bg-[#111C44] border-[#1B254B] text-amber-300 hover:bg-[#1B254B]' 
                : 'bg-white border-[#E9EDF7] text-[#2B3674] hover:bg-[#F4F7FE]'
            }`}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        {/* HEADER / REWARD BANNER */}
        {customer && (
          <div className={`border rounded-3xl p-6 mb-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition ${
            darkMode ? 'bg-[#111C44] border-[#1B254B]' : 'bg-white border-[#E9EDF7]'
          }`}>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-[#2B3674]'}`}>Hello, {customer.name}! 👋</h1>
                <span className="bg-[#4318FF]/10 text-[#4318FF] text-xs font-bold px-3 py-1 rounded-full">
                  Visit #{customer.visitCount}
                </span>
              </div>
              <p className="text-xs text-[#A3AED0] mt-0.5">Table 01 • Interactive Ordering</p>
            </div>

            {/* REWARD CARD (Shows ONLY if unlocked) */}
            {perk && (
              <div className="bg-[#4318FF] text-white p-4 rounded-2xl flex items-center gap-3 max-w-md shadow-lg shadow-[#4318FF]/20 animate-pulse">
                <Gift className="w-8 h-8 text-amber-300 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-white">{perk.title}</p>
                  <p className="text-[11px] text-blue-100 leading-tight mt-0.5">{perk.description}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CATEGORIES & DIETARY FILTER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          
          {/* Categories Pill Horizontal Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full md:w-auto scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition whitespace-nowrap ${
                  activeCategory === cat.key
                    ? 'bg-[#4318FF] text-white shadow-md shadow-[#4318FF]/30'
                    : darkMode
                      ? 'bg-[#111C44] text-[#A3AED0] hover:text-white border border-[#1B254B]'
                      : 'bg-white text-[#A3AED0] hover:text-[#2B3674] border border-[#E9EDF7]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Veg / Non-Veg Pill Toggle */}
          <div className={`flex border p-1 rounded-2xl shrink-0 shadow-sm ${
            darkMode ? 'bg-[#111C44] border-[#1B254B]' : 'bg-white border-[#E9EDF7]'
          }`}>
            <button
              onClick={() => setVegFilter('all')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                vegFilter === 'all' 
                  ? darkMode ? 'bg-[#0B1437] text-white' : 'bg-[#F4F7FE] text-[#2B3674]' 
                  : 'text-[#A3AED0]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setVegFilter('veg')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                vegFilter === 'veg' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'text-[#A3AED0]'
              }`}
            >
              🟢 Veg
            </button>
            <button
              onClick={() => setVegFilter('nonveg')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                vegFilter === 'nonveg' 
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                  : 'text-[#A3AED0]'
              }`}
            >
              🔴 Non-Veg
            </button>
          </div>
        </div>

        {/* DISHES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMenu.map((item) => (
            <div
              key={item._id}
              className={`border rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 ${
                darkMode ? 'bg-[#111C44] border-[#1B254B]' : 'bg-white border-[#E9EDF7]'
              } ${
                item.isAvailable
                  ? 'hover:shadow-xl hover:-translate-y-1'
                  : 'opacity-50'
              }`}
            >
              <div>
                {/* Food Image / Placeholder */}
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-40 object-cover rounded-2xl mb-4 border border-slate-700/20" />
                ) : (
                  <div className={`w-full h-36 rounded-2xl mb-4 flex items-center justify-center ${
                    darkMode ? 'bg-[#0B1437] text-[#A3AED0]' : 'bg-[#F4F7FE] text-[#A3AED0]'
                  }`}>
                    <UtensilsCrossed className="w-8 h-8 opacity-40" />
                  </div>
                )}

                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    item.isVeg ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                  }`}>
                    {item.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
                  </span>

                  {item.isAvailable ? (
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg ${
                      darkMode ? 'bg-[#0B1437] text-white' : 'bg-[#F4F7FE] text-[#2B3674]'
                    }`}>
                      Stock: {item.stockCount}
                    </span>
                  ) : (
                    <span className="text-[10px] bg-rose-500/10 text-rose-500 font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Sold Out
                    </span>
                  )}
                </div>

                <h3 className={`font-extrabold text-lg ${darkMode ? 'text-white' : 'text-[#2B3674]'}`}>
                  {item.name}
                </h3>
                <p className="text-xs text-[#A3AED0] capitalize mt-0.5">{item.category}</p>
              </div>

              <div className={`pt-4 mt-4 border-t flex justify-between items-center ${
                darkMode ? 'border-[#1B254B]' : 'border-[#F4F7FE]'
              }`}>
                <div>
                  <span className="text-[10px] text-[#A3AED0] font-bold uppercase tracking-wider">Price</span>
                  <p className={`text-xl font-black ${darkMode ? 'text-white' : 'text-[#2B3674]'}`}>₹{item.price}</p>
                </div>

                {item.isAvailable ? (
                  <button
                    onClick={() => alert(`To order "${item.name}", send a message or voice note to our Telegram Bot!`)}
                    className="bg-[#4318FF] hover:bg-[#3311CC] text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl transition flex items-center gap-1.5 shadow-md shadow-[#4318FF]/20"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Order
                  </button>
                ) : (
                  <span className="text-xs text-rose-500 font-bold">Unavailable</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredMenu.length === 0 && (
          <div className={`text-center py-16 rounded-3xl border ${
            darkMode ? 'bg-[#111C44] border-[#1B254B]' : 'bg-white border-[#E9EDF7]'
          }`}>
            <UtensilsCrossed className="w-12 h-12 text-[#A3AED0] mx-auto mb-3" />
            <p className="text-[#A3AED0] text-sm font-bold">No dishes found in this category.</p>
          </div>
        )}
      </main>
    </div>
  );
}