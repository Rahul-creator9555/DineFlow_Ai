'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Utensils, ShieldCheck, ArrowRight, Sparkles, UserCheck } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  // Auto-redirect agar user pehle se logged in hai
  useEffect(() => {
    const loggedUser = localStorage.getItem('user');
    if (loggedUser) {
      try {
        const user = JSON.parse(loggedUser);
        if (user.role === 'manager' || user.role === 'admin') {
          router.push('/manager');
        } else if (user.role === 'kitchen') {
          router.push('/kitchen');
        }
      } catch (e) {}
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0F0F10] text-white flex flex-col justify-between p-6 font-sans relative overflow-hidden">
      
      {/* Background Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#E67E33]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header / Brand */}
      <header className="max-w-5xl mx-auto w-full flex justify-between items-center py-4 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#E67E33]/15 text-[#E67E33] rounded-2xl border border-[#E67E33]/20">
            <Utensils className="w-6 h-6" />
          </div>
          <span className="text-xl font-black tracking-tight text-white">DineFlow AI</span>
        </div>

        <Link 
          href="/login" 
          className="text-xs font-extrabold px-4 py-2.5 rounded-2xl bg-[#1A1A1C] border border-[#2E2E32] text-[#9E9EAC] hover:text-white transition flex items-center gap-1.5"
        >
          <ShieldCheck className="w-4 h-4 text-[#E67E33]" />
          Staff Login
        </Link>
      </header>

      {/* Main Hero Card */}
      <main className="max-w-md mx-auto w-full text-center z-10 my-auto py-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E67E33]/10 border border-[#E67E33]/20 text-[#E67E33] text-xs font-extrabold mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" /> Next-Gen AI Dining Experience
        </div>

        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight text-white mb-4">
          Welcome to <br /><span className="text-[#E67E33]">DineFlow</span>
        </h1>

        <p className="text-xs text-[#9E9EAC] leading-relaxed mb-8 max-w-sm mx-auto font-medium">
          Order directly from your table via QR, test voice AI ordering, or access staff management.
        </p>

        {/* User Flow Action Buttons */}
        <div className="space-y-3.5">
          {/* Customer Flow */}
          <Link
            href="/menu"
            className="w-full py-4 px-6 rounded-2xl bg-[#E67E33] hover:bg-[#d47029] text-white font-extrabold text-sm shadow-xl shadow-[#E67E33]/25 transition flex items-center justify-center gap-2 group"
          >
            <UserCheck className="w-4 h-4" />
            Explore Menu & Order As Guest
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Staff Login Flow */}
          <Link
            href="/login"
            className="w-full py-3.5 px-6 rounded-2xl bg-[#1A1A1C] hover:bg-[#2E2E32] text-[#9E9EAC] hover:text-white border border-[#2E2E32] font-extrabold text-xs transition flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-[#E67E33]" />
            Staff / Manager Sign In
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] text-[#9E9EAC] z-10 py-2">
        Powered by DineFlow AI Engine • VibeAthon 6.0
      </footer>
    </div>
  );
}