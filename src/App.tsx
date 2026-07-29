/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const storedAuth = localStorage.getItem('fxScannerAuth');
      if (storedAuth) {
        try {
          const { username: storedUsername, expiresAt } = JSON.parse(storedAuth);
          if (Date.now() < expiresAt) {
            setUsername(storedUsername);
            setIsLoggedIn(true);
          } else {
            localStorage.removeItem('fxScannerAuth');
          }
        } catch (e) {
          localStorage.removeItem('fxScannerAuth');
        }
      }
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.toLowerCase() === 'jfx') {
      setIsLoggedIn(true);
      setError('');
      // Save for 30 days
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem('fxScannerAuth', JSON.stringify({ username, expiresAt }));
    } else {
      setError('Invalid username');
    }
  };

  if (isCheckingAuth) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">Forex Scanner</h1>
            <p className="text-neutral-400 text-sm">Please log in to access the dashboard.</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                autoFocus
              />
            </div>
            
            {error && <p className="text-rose-500 text-sm font-medium">{error}</p>}
            
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold tracking-wide uppercase py-3.5 rounded-xl transition-colors"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main>
      <Dashboard />
    </main>
  );
}
