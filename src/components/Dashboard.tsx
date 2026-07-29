import React, { useState, useEffect, useRef } from 'react';
import { SignalData, Timeframe } from '../types';
import { SignalCard } from './SignalCard';
import { Activity, Bell, BellOff, RefreshCw, AlertTriangle, Info, ArrowDown, ArrowUp, Download } from 'lucide-react';
import { cn } from './SignalCard';
import { format } from 'date-fns';

export const Dashboard: React.FC = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>('15m');
  const [data, setData] = useState<SignalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // Risk Management State
  const [maxLossUsd, setMaxLossUsd] = useState<number>(25);
  const [tpPoints, setTpPoints] = useState<number>(180);
  const [slPoints, setSlPoints] = useState<number>(650);
  
  // Track previous signals to avoid spamming notifications
  const previousSignals = useRef<Record<string, string>>({});

  const checkNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  };

  useEffect(() => {
    checkNotificationPermission();

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const toggleNotifications = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications');
      return;
    }
    
    if (Notification.permission === 'granted') {
      // Browsers don't allow "revoking" easily via JS, so we just toggle our internal state
      setNotificationsEnabled(!notificationsEnabled);
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
      }
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/signals?timeframe=${timeframe}`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch data: ${response.status} ${text.substring(0, 50)}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON but got ${contentType}: ${text.substring(0, 50)}`);
      }
      
      const results: SignalData[] = await response.json();
      setData(results);
      setLastUpdated(new Date());

      // Check for notifications
      if (notificationsEnabled && 'Notification' in window) {
        results.forEach((pair) => {
          const prevSignal = previousSignals.current[pair.pair];
          if (pair.signal !== 'neutral' && prevSignal !== pair.signal) {
            new Notification(`Forex Alert: ${pair.pair} - ${pair.signal.toUpperCase()}`, {
              body: `Stochastic %K: ${pair.k.toFixed(2)}, %D: ${pair.d.toFixed(2)} on ${timeframe}`,
              icon: '/vite.svg' // Placeholder icon
            });
          }
          previousSignals.current[pair.pair] = pair.signal;
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch immediately and set up polling
  useEffect(() => {
    fetchData();
    // Clear previous signals tracking when timeframe changes so it alerts again if needed
    previousSignals.current = {}; 
    
    // Poll every 1 minute
    const interval = setInterval(fetchData, 60 * 1000);
    return () => clearInterval(interval);
  }, [timeframe]);

  // Sort data: Most Overbought (highest K) or Most Oversold (lowest K) at the top
  // Actually, we can just highlight the extremes.
  const sortedData = [...data].sort((a, b) => {
    // If one is a signal and other is not, prioritize signal
    if (a.signal !== 'neutral' && b.signal === 'neutral') return -1;
    if (a.signal === 'neutral' && b.signal !== 'neutral') return 1;
    
    // Calculate extremeness (distance from 50)
    const extA = Math.abs(a.k - 50);
    const extB = Math.abs(b.k - 50);
    return extB - extA;
  });

  const mostOverbought = [...data].sort((a, b) => b.k - a.k)[0];
  const mostOversold = [...data].sort((a, b) => a.k - b.k)[0];

  const calculateLotSize = (pair: string) => {
    const riskUsd = maxLossUsd;
    let lossPerLotUsd = slPoints;

    const getPrice = (p: string) => data.find(d => d.pair === p)?.close || 0;

    if (pair.endsWith('USD')) {
      lossPerLotUsd = slPoints;
    } else if (pair.endsWith('AUD')) {
      const audusd = getPrice('AUDUSD');
      if (audusd) lossPerLotUsd = slPoints * audusd;
    } else if (pair.endsWith('CAD')) {
      const audcad = getPrice('AUDCAD');
      const audusd = getPrice('AUDUSD');
      if (audcad && audusd) {
        const usdcad = audcad / audusd;
        lossPerLotUsd = slPoints / usdcad;
      }
    } else if (pair.endsWith('CHF')) {
      const usdchf = getPrice('USDCHF');
      if (usdchf) lossPerLotUsd = slPoints / usdchf;
    }

    if (!lossPerLotUsd) return 0;
    return riskUsd / lossPerLotUsd;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-indigo-500/30 font-sans p-6 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
                <Activity size={24} strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Forex Scanner</h1>
            </div>
            <p className="text-neutral-400 max-w-xl leading-relaxed">
              Real-time Stochastic Oscillator (8,3,3) scanner across major pairs. 
              Close/Close prices smoothed. Buy at ≤ 5, Sell at ≥ 95.
              <br />
              <span className="text-xs text-neutral-500">*Note: Price data is sourced from Yahoo Finance due to TradingView API limitations.</span>
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 bg-neutral-900/80 p-1.5 rounded-xl border border-neutral-800 backdrop-blur-sm self-start md:self-end">
              {(['15m', '1h', '4h'] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={cn(
                    "px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all",
                    timeframe === tf 
                      ? "bg-white text-black shadow-sm" 
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                  )}
                >
                  {tf}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-4 text-sm justify-end">
              <button 
                onClick={toggleNotifications}
                className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all",
                  notificationsEnabled 
                    ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                    : "border-neutral-800 text-neutral-400 hover:bg-neutral-800"
                )}
              >
                {notificationsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
                {notificationsEnabled ? "Alerts On" : "Alerts Off"}
              </button>
              
              <div className="flex items-center gap-2 text-neutral-500">
                <RefreshCw size={14} className={cn(loading && "animate-spin text-white")} />
                {lastUpdated ? format(lastUpdated, 'HH:mm:ss') : '--:--:--'}
              </div>
            </div>
          </div>
        </header>

        {/* Risk Management Config Bar */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 md:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Max Loss Per Trade (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
              <input 
                type="number" 
                step="1"
                value={maxLossUsd} 
                onChange={(e) => setMaxLossUsd(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Take Profit (Points)</label>
            <input 
              type="number" 
              value={tpPoints} 
              onChange={(e) => setTpPoints(Number(e.target.value))}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Stop Loss (Points)</label>
            <input 
              type="number" 
              value={slPoints} 
              onChange={(e) => setSlPoints(Number(e.target.value))}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-center gap-3">
            <AlertTriangle size={20} />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Highlights Section */}
        {!loading && data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mostOverbought && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-rose-400 mb-1">
                    <ArrowDown size={18} strokeWidth={3} />
                    <span className="text-sm font-bold uppercase tracking-wider">Most Overbought</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">{mostOverbought.pair}</h2>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-neutral-400">Stoch %K</div>
                  <div className={cn("text-2xl font-mono font-bold", mostOverbought.k >= 95 ? "text-rose-400" : "text-neutral-200")}>
                    {mostOverbought.k.toFixed(2)}
                  </div>
                </div>
              </div>
            )}
            
            {mostOversold && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 mb-1">
                    <ArrowUp size={18} strokeWidth={3} />
                    <span className="text-sm font-bold uppercase tracking-wider">Most Oversold</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">{mostOversold.pair}</h2>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-neutral-400">Stoch %K</div>
                  <div className={cn("text-2xl font-mono font-bold", mostOversold.k <= 5 ? "text-emerald-400" : "text-neutral-200")}>
                    {mostOversold.k.toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Grid Section */}
        {loading && data.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-56 bg-neutral-900/50 border border-neutral-800/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                All Pairs <span className="text-sm font-normal text-neutral-500 bg-neutral-800 px-2.5 py-0.5 rounded-full">{sortedData.length}</span>
              </h2>
            </div>
            
            {sortedData.length === 0 && !loading && (
              <div className="p-12 border border-neutral-800 border-dashed rounded-2xl flex flex-col items-center justify-center text-neutral-500 gap-4">
                <Info size={32} />
                <p>No data available for the selected timeframe.</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedData.map((pairData) => (
                <SignalCard 
                  key={pairData.pair} 
                  data={pairData} 
                  lotSize={calculateLotSize(pairData.pair)} 
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Footer Section */}
        <footer className="pt-10 pb-6 mt-10 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} Forex Scanner. All rights reserved.
          </div>
          {deferredPrompt && (
            <button 
              onClick={handleInstallClick}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-indigo-500/50 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all"
            >
              <Download size={16} />
              Install PWA App
            </button>
          )}
        </footer>
        
      </div>
    </div>
  );
};
