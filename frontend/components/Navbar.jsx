'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center text-white">
      <div className="flex items-center gap-6">
        <span className="text-xl font-black text-amber-400 tracking-wider cursor-pointer" onClick={() => router.push('/')}>
          DineFlow AI 🚀
        </span>

        {user && (
          <div className="hidden md:flex gap-4 text-sm font-semibold text-slate-300">
            {(user.role === 'manager' || user.role === 'admin') && (
              <button onClick={() => router.push('/manager')} className="hover:text-amber-400">
                📊 Manager Panel
              </button>
            )}
            {(user.role === 'kitchen' || user.role === 'admin' || user.role === 'manager') && (
              <button onClick={() => router.push('/kitchen')} className="hover:text-amber-400">
                👨‍🍳 Kitchen KDS
              </button>
            )}
            {(user.role === 'waiter' || user.role === 'admin' || user.role === 'manager') && (
              <button onClick={() => router.push('/waiter')} className="hover:text-amber-400">
                🛎️ Waiter Tasks
              </button>
            )}
            <button onClick={() => router.push('/menu')} className="hover:text-amber-400">
              📖 Digital Menu
            </button>
          </div>
        )}
      </div>

      <div>
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-xs bg-slate-800 border border-slate-700 px-3 py-1 rounded-full text-amber-300 capitalize">
              {user.name} ({user.role})
            </span>
            <button onClick={handleLogout} className="text-xs bg-rose-900/60 hover:bg-rose-800 text-rose-200 font-bold px-3 py-1.5 rounded-lg border border-rose-700">
              Logout
            </button>
          </div>
        ) : (
          <button onClick={() => router.push('/login')} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg">
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}