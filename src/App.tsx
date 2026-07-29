/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { ProfitCalculator } from './components/ProfitCalculator';
import { Activity, Calculator, LogOut } from 'lucide-react';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<'scanner' | 'calculator'>('scanner');
  const [metaquotesId, setMetaquotesId] = useState('2EB3A8DA');

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

  const handleLogout = () => {
    localStorage.removeItem('fxScannerAuth');
    setIsLoggedIn(false);
    setUsername('');
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
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">JFX Scanner</h1>
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
    <main className="min-h-screen bg-[#0A0A0A] text-white font-sans flex flex-col">
      <nav className="border-b border-neutral-800 bg-neutral-950 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0277bd] to-[#01579b] flex items-center justify-center font-black italic text-white tracking-tighter text-sm">
                J<span className="text-[#ffc107]">FX</span>
              </div>
              <span className="font-bold tracking-wide hidden sm:block">Scanner</span>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-4 flex-1 justify-center">
              <button
                onClick={() => setActiveTab('scanner')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === 'scanner'
                    ? 'bg-indigo-500/10 text-indigo-400'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-300'
                }`}
              >
                <Activity size={18} />
                <span className="hidden sm:inline">Scanner</span>
              </button>
              <button
                onClick={() => setActiveTab('calculator')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === 'calculator'
                    ? 'bg-indigo-500/10 text-indigo-400'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-300'
                }`}
              >
                <Calculator size={18} />
                <span className="hidden sm:inline">Profit Calculator</span>
              </button>
            </div>

            <div className="flex items-center gap-1 sm:gap-3">
              <div className="flex items-center gap-1 sm:gap-2 bg-neutral-900 rounded-lg px-2 sm:px-3 py-1.5 border border-neutral-800 focus-within:border-indigo-500/50 transition-colors">
                <span className="text-xs text-neutral-400 font-semibold tracking-wider hidden sm:inline">MQID</span>
                <input 
                  type="text"
                  value={metaquotesId}
                  onChange={(e) => setMetaquotesId(e.target.value)}
                  className="bg-transparent border-none focus:outline-none text-white text-xs sm:text-sm w-16 sm:w-20 uppercase font-mono"
                  placeholder="ID"
                />
                <button
                  onClick={() => alert(`MQID saved: ${metaquotesId}`)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded transition-colors"
                >
                  SAVE
                </button>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors"
                title="Log Out"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline text-sm font-semibold">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1">
        {activeTab === 'scanner' ? <Dashboard metaquotesId={metaquotesId} /> : <ProfitCalculator currentRates={[]} />}
      </div>
    </main>
  );
}

