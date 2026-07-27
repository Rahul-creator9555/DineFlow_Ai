'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UtensilsCrossed, LayoutDashboard, ChefHat, LogOut, LogIn } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    router.push('/login');
  };

  return (
    <nav className="bg-[#1A1A1C]/90 backdrop-blur-md border-b border-[#2E2E32] px-6 py-3.5 flex justify-between items-center text-white sticky top-0 z-40 transition-all">
      {/* LEFT: BRAND & NAV LINKS */}
      <div className="flex items-center gap-8">
        <div 
          className="flex items-center gap-2 cursor-pointer group" 
          onClick={() => router.push('/menu')}
        >
          <div className="p-2 bg-[#E67E33] text-white rounded-xl shadow-md shadow-[#E67E33]/30 group-hover:scale-105 transition">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <span className="text-xl font-black tracking-tight text-white">
            DineFlow <span className="text-[#E67E33]">AI</span>
          </span>
        </div>

        {/* ROLE BASED NAVIGATION LINKS */}
        <div className="hidden md:flex items-center gap-2 text-xs font-bold text-[#9E9EAC]">
          {/* Public Digital Menu for Everyone */}
          <button 
            onClick={() => router.push('/menu')} 
            className="px-3.5 py-2 rounded-xl hover:text-white hover:bg-[#2E2E32] transition flex items-center gap-1.5"
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-[#E67E33]" />
            Digital Menu
          </button>

          {/* MANAGER ONLY LINK */}
          {user && (user.role === 'manager' || user.role === 'admin') && (
            <button 
              onClick={() => router.push('/manager')} 
              className="px-3.5 py-2 rounded-xl hover:text-white hover:bg-[#2E2E32] transition flex items-center gap-1.5 text-amber-400"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Manager Panel
            </button>
          )}

          {/* KITCHEN KDS LINK (Accessible by Kitchen Chef, Manager & Admin) */}
          {user && (user.role === 'kitchen' || user.role === 'manager' || user.role === 'admin') && (
            <button 
              onClick={() => router.push('/kitchen')} 
              className="px-3.5 py-2 rounded-xl hover:text-white hover:bg-[#2E2E32] transition flex items-center gap-1.5 text-emerald-400"
            >
              <ChefHat className="w-3.5 h-3.5" />
              Kitchen KDS
            </button>
          )}
        </div>
      </div>

      {/* RIGHT: STAFF AUTH STATUS */}
      <div>
        {user ? (
          <div className="flex items-center gap-3">
            <div className="bg-[#0F0F10] border border-[#2E2E32] px-3 py-1.5 rounded-2xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-extrabold text-white capitalize">
                {user.name} <span className="text-[#E67E33] text-[10px]">({user.role})</span>
              </span>
            </div>

            <button 
              onClick={handleLogout} 
              className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20 transition flex items-center justify-center"
              title="Logout Staff"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => router.push('/login')} 
            className="bg-[#1A1A1C] hover:bg-[#2E2E32] border border-[#2E2E32] text-[#9E9EAC] hover:text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-2"
          >
            <LogIn className="w-3.5 h-3.5" /> Staff Portal
          </button>
        )}
      </div>
    </nav>
  );
}