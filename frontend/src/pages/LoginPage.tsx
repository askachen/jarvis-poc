import React, { useState } from 'react';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/auth';
import toast from 'react-hot-toast';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.login({ email, password });
      setAuth(data.token, data.user);
      window.location.href = '/';
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center
      bg-gradient-to-br from-indigo-50 via-white to-purple-50
      dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-3xl">J</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome to Jarvis
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Your AI-powered assistant
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border
          border-gray-100 dark:border-gray-700 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@jarvis.local"
                autoComplete="email"
                autoFocus
                className="w-full px-3 py-2.5 rounded-lg text-sm
                  bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600
                  text-gray-900 dark:text-gray-100 placeholder-gray-400
                  focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
                  transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-3 py-2.5 rounded-lg text-sm
                  bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600
                  text-gray-900 dark:text-gray-100 placeholder-gray-400
                  focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
                  transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800
                rounded-lg px-3 py-2">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg font-medium text-sm
                bg-indigo-600 hover:bg-indigo-700 text-white
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors shadow-sm"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Demo: <code className="font-mono">user@jarvis.local</code> / <code className="font-mono">user1234</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
