'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = Router();
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState('auth'); // 'auth' or 'otp'
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'customer', otp: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleRedirect = (role) => {
    switch (role) {
      case 'manager':
      case 'admin':
        router.push('/manager');
        break;
      case 'kitchen':
        router.push('/kitchen');
        break;
      case 'waiter':
        router.push('/waiter');
        break;
      default:
        router.push('/');
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (step === 'otp') {
        const res = await fetch('http://localhost:5000/api/auth/verify-otp', {
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
        const res = await fetch('http://localhost:5000/api/auth/login', {
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
        const res = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Registration failed');

        alert(`Demo OTP generated: ${data.demoOtp}`);
        setStep('otp');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-amber-400">DineFlow AI</h1>
          <p className="text-sm text-slate-400 mt-1">
            {step === 'otp' ? 'Enter Email OTP' : isLogin ? 'Sign in to your account' : 'Create a new staff or customer account'}
          </p>
        </div>

        {error && <div className="bg-rose-900/50 border border-rose-500 text-rose-200 text-sm p-3 rounded-lg mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 'otp' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">6-Digit OTP</label>
              <input
                type="text"
                required
                maxLength={6}
                value={formData.otp}
                onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-center text-2xl tracking-widest text-amber-300 focus:outline-none focus:border-amber-500"
                placeholder="123456"
              />
            </div>
          ) : (
            <>
              {!isLogin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500"
                    placeholder="John Doe"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500"
                  placeholder="name@restaurant.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-500"
                  placeholder="••••••••"
                />
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Select Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="customer">Customer</option>
                    <option value="kitchen">Kitchen Staff</option>
                    <option value="waiter">Waiter Staff</option>
                    <option value="manager">Restaurant Manager</option>
                  </select>
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-lg transition text-sm mt-2"
          >
            {loading ? 'Processing...' : step === 'otp' ? 'Verify OTP' : isLogin ? 'Sign In' : 'Send OTP & Register'}
          </button>
        </form>

        {step === 'auth' && (
          <div className="mt-6 text-center text-xs text-slate-400">
            {isLogin ? "Don't have an account? " : 'Already registered? '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-amber-400 font-semibold hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}