'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UtensilsCrossed, Mail, Lock, User, ArrowRight } from 'lucide-react';

// 🌐 Dynamic API Base URL with Deployment Fallback
const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_BASE_URL || 
  process.env.NEXT_PUBLIC_BACKEND_URL || 
  'https://dineflow-backend.onrender.com';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState('auth');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'kitchen', otp: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 🚀 Helper to Redirect Based on Staff Role
  const handleRoleRedirect = (role) => {
    switch (role) {
      case 'manager':
      case 'admin':
        router.push('/manager');
        break;
      case 'kitchen':
        router.push('/kitchen');
        break;
      default:
        router.push('/menu');
        break;
    }
  };

  // 🔑 GOOGLE OAUTH CALLBACK HANDLER (Auto Catch Token & User)
  useEffect(() => {
    const token = searchParams.get('token');
    const userDataStr = searchParams.get('user');

    if (token && userDataStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userDataStr));

        // Save Auth Session to LocalStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Auto Navigate to Manager/Kitchen Panel
        handleRoleRedirect(user.role);
      } catch (err) {
        console.error('Error handling Google Auth payload:', err);
        setError('Failed to process Google login response.');
      }
    }
  }, [searchParams]);

  // 📩 Handle Email/Password & OTP Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (step === 'otp') {
        const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, otp: formData.otp }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'OTP Verification failed');

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        handleRoleRedirect(data.user.role);
        return;
      }

      if (isLogin) {
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Login failed');

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        handleRoleRedirect(data.user.role);
      } else {
        const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Registration failed');

        alert(`Demo Staff OTP: ${data.demoOtp}`);
        setStep('otp');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  return (
    <div className="min-h-screen bg-[#0F0F10] text-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-[#1A1A1C] border border-[#2E2E32] p-8 rounded-3xl shadow-2xl relative">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-[#E67E33]/10 text-[#E67E33] rounded-2xl mb-3 border border-[#E67E33]/20">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Staff Portal
          </h1>
          <p className="text-xs text-[#9E9EAC] mt-1.5 font-medium">
            Authorized Personnel Access Only (Chef & Managers)
          </p>
        </div>

        {error && (
          <div className="bg-rose-950/60 border border-rose-800 text-rose-300 text-xs p-3.5 rounded-2xl mb-5 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 'otp' ? (
            <div>
              <label className="block text-xs font-bold text-[#9E9EAC] mb-1.5">6-Digit OTP</label>
              <input
                type="text"
                required
                maxLength={6}
                value={formData.otp}
                onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                className="w-full bg-[#0F0F10] border border-[#2E2E32] rounded-2xl px-4 py-3 text-center text-2xl tracking-widest text-[#E67E33] focus:outline-none focus:border-[#E67E33] font-mono"
                placeholder="123456"
              />
            </div>
          ) : (
            <>
              {!isLogin && (
                <div>
                  <label className="block text-xs font-bold text-[#9E9EAC] mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#9E9EAC] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#0F0F10] border border-[#2E2E32] rounded-2xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-[#E67E33]"
                      placeholder="Staff Name"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#9E9EAC] mb-1.5">Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#9E9EAC] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#0F0F10] border border-[#2E2E32] rounded-2xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-[#E67E33]"
                    placeholder="staff@dineflow.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#9E9EAC] mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#9E9EAC] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-[#0F0F10] border border-[#2E2E32] rounded-2xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-[#E67E33]"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-xs font-bold text-[#9E9EAC] mb-1.5">Staff Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-[#0F0F10] border border-[#2E2E32] rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#E67E33]"
                  >
                    <option value="kitchen">Kitchen Chef</option>
                    <option value="manager">Restaurant Manager</option>
                  </select>
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E67E33] hover:bg-[#d47029] text-white font-extrabold py-3.5 rounded-2xl transition text-xs shadow-lg shadow-[#E67E33]/20 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? 'Authenticating...' : step === 'otp' ? 'Verify OTP' : isLogin ? 'Staff Sign In' : 'Register Staff Account'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* GOOGLE AUTH OPTION */}
        {step === 'auth' && (
          <>
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#2E2E32]"></div></div>
              <span className="relative bg-[#1A1A1C] px-3 text-[10px] uppercase font-bold text-[#9E9EAC]">Or Continue With</span>
            </div>

            <button
              onClick={handleGoogleAuth}
              type="button"
              className="w-full bg-[#0F0F10] hover:bg-[#2E2E32] text-white font-bold py-3 rounded-2xl border border-[#2E2E32] transition text-xs flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z" />
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z" />
              </svg>
              Sign in with Google
            </button>

            <div className="mt-6 text-center text-xs text-[#9E9EAC]">
              {isLogin ? "New Staff Member? " : 'Already registered? '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-[#E67E33] font-bold hover:underline ml-1"
              >
                {isLogin ? 'Register Role' : 'Log In'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// 🛑 EXPORT WITH SUSPENSE WRAPPER
export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0F0F10] text-white flex items-center justify-center font-sans text-xs">Loading Auth Session...</div>}>
      <AuthContent />
    </Suspense>
  );
}