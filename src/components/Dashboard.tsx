import React, { useState, useEffect, useRef } from 'react';
import { SignalData, Timeframe } from '../types';
import { SignalCard } from './SignalCard';
import { Activity, Bell, BellOff, RefreshCw, AlertTriangle, Info, ArrowDown, ArrowUp, Download } from 'lucide-react';
import { cn } from './SignalCard';
import { format } from 'date-fns';

interface DashboardProps {
  metaquotesId?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ metaquotesId }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('15m');
  const [data, setData] = useState<SignalData[]>([]);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // Risk Management State
  const [balance, setBalance] = useState<number>(1000);
  const [riskPercent, setRiskPercent] = useState<number>(2.5);
  const [tpPoints, setTpPoints] = useState<number>(0);
  const [slPoints, setSlPoints] = useState<number>(850);
  
  // Notification State
  const [priceAlerts, setPriceAlerts] = useState<Record<string, number>>({});

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

  const sendPushNotification = (title: string, body: string) => {
    if (metaquotesId && metaquotesId.length > 0) {
      console.log(`[MQ Push Simulated] To: ${metaquotesId} | Title: ${title} | Body: ${body}`);
      if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(`MQ Push: ${title}`, { body: `(To MQID: ${metaquotesId})\n${body}`, icon: '/vite.svg' });
      }
    } else {
      console.log(`[Local Notification] Title: ${title} | Body: ${body}`);
      if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/vite.svg' });
      }
    }
  };

  const handleSetPriceAlert = (pair: string, price: number) => {
    setPriceAlerts(prev => ({ ...prev, [pair]: price }));
    alert(`Price alert set! You will be notified when ${pair} hits ${price}.` + (metaquotesId ? ` (via MQID ${metaquotesId})` : ''));
  };

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
      results.forEach((pair) => {
        // 1. Sinyal Terbuka (Open Signal) Notification
        const prevSignal = previousSignals.current[pair.pair];
        if (pair.signal !== 'neutral' && prevSignal !== pair.signal) {
          sendPushNotification(
            `Forex Alert: ${pair.pair} - ${pair.signal.toUpperCase()}`,
            `Stochastic %K: ${pair.k.toFixed(2)}, %D: ${pair.d.toFixed(2)} on ${timeframe}`
          );
        }
        previousSignals.current[pair.pair] = pair.signal;
        
        // 2. Price Notification
        if (priceAlerts[pair.pair]) {
          const alertPrice = priceAlerts[pair.pair];
          // Check if current close crossed the alert price. 
          // We can do a simple check: if it is within 0.05% of the target, alert.
          // Or just notify that it's close. We'll do a simple cross check if we had previous close, 
          // but for now, just trigger if the difference is very small (within 5 pips).
          const pipDiff = Math.abs(pair.close - alertPrice) / 0.0001; // roughly pips
          if (pipDiff < 5) {
            sendPushNotification(
              `Price Alert: ${pair.pair} reached ${alertPrice}`,
              `Current price is ${pair.close.toFixed(5)}`
            );
            // Remove the alert so it doesn't spam
            setPriceAlerts(prev => {
              const newAlerts = { ...prev };
              delete newAlerts[pair.pair];
              return newAlerts;
            });
          }
        }
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch live prices every 10 seconds
  useEffect(() => {
    const fetchLivePrices = async () => {
      try {
        const res = await fetch('/api/prices');
        if (res.ok) {
          const prices = await res.json();
          setLivePrices(prices);
        }
      } catch (e) {
        console.error('Failed to fetch live prices', e);
      }
    };
    
    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 10000);
    return () => clearInterval(interval);
  }, []);

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
    const riskUsd = balance * (riskPercent / 100);
    const getPrice = (p: string) => data.find(d => d.pair === p)?.close || 0;

    // Default 1 point = $1
    if (pair === 'NASDAQ' || pair === 'US30' || pair === 'XAUUSD') {
      const lossPerLotUsd = slPoints * 1;
      return riskUsd / lossPerLotUsd;
    }

    const quoteCurrency = pair.substring(3, 6);
    const pointValueInQuote = quoteCurrency === 'JPY' ? 100 : 1;
    const lossInQuote = slPoints * pointValueInQuote;
    
    let lossPerLotUsd = lossInQuote; // Fallback to raw points if conversion fails
    
    if (quoteCurrency === 'USD') {
      lossPerLotUsd = lossInQuote;
    } else {
      let usdQuote = getPrice(`USD${quoteCurrency}`); 
      if (!usdQuote) {
        // Derive USDQuote from EUR, AUD, or GBP crosses if direct quote not found
        const eurQuote = getPrice(`EUR${quoteCurrency}`);
        const eurUsd = getPrice('EURUSD');
        if (eurQuote && eurUsd) {
          usdQuote = eurQuote / eurUsd;
        } else {
          const audQuote = getPrice(`AUD${quoteCurrency}`);
          const audUsd = getPrice('AUDUSD');
          if (audQuote && audUsd) {
            usdQuote = audQuote / audUsd;
          } else {
             const gbpQuote = getPrice(`GBP${quoteCurrency}`);
             const gbpUsd = getPrice('GBPUSD');
             if (gbpQuote && gbpUsd) {
               usdQuote = gbpQuote / gbpUsd;
             }
          }
        }
      }
      
      if (usdQuote) {
        lossPerLotUsd = lossInQuote / usdQuote;
      } else if (quoteCurrency === 'CHF') {
          // If we couldn't derive USDCHF, try to invert it if we have it? 
          // Wait, getPrice('USDCHF') is already tried above.
      }
    }

    if (!lossPerLotUsd || lossPerLotUsd <= 0) return 0;
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
              Close/Close prices smoothed. <span className="bg-yellow-400 text-black font-bold px-1 rounded">Buy at ≤ {timeframe === '4h' ? 1 : timeframe === '1h' ? 3 : 5}, Sell at ≥ {timeframe === '4h' ? 99 : timeframe === '1h' ? 97 : 95}.</span>
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
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Balance (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
              <input 
                type="number" 
                value={balance} 
                onChange={(e) => setBalance(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Risk Per Trade (%)</label>
            <div className="relative">
              <input 
                type="number" 
                step="0.1"
                value={riskPercent} 
                onChange={(e) => setRiskPercent(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-4 pr-8 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">%</span>
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
                  livePrice={livePrices[pairData.pair]}
                  onSetPriceAlert={(price: number) => handleSetPriceAlert(pairData.pair, price)}
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
          <button 
            onClick={() => {
              if (deferredPrompt) {
                handleInstallClick();
              } else {
                alert('Install prompt is not available. You might have already installed the app, or your browser does not support it.');
              }
            }}
            className="flex items-center gap-2 px-5 py-2 rounded-xl border border-[#00f076]/30 text-white bg-black hover:bg-neutral-900 transition-all shadow-sm group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48" className="group-hover:scale-105 transition-transform">
              <path fill="#4caf50" d="M41.7 20.3L9.6 1.8C8-.1 6.1-1.3 6.1 1.9v44.3c0 3.2 1.9 2 3.5.1l32.1-18.5c1.6-1.9 1.6-5.6 0-7.5z"/>
              <path fill="#2196f3" d="M31.2 24l-25.1 24.2c-.3 0-.6-.1-.9-.2L31.2 24z"/>
              <path fill="#ffc107" d="M41.7 27.8l-10.5-6v-3.7l10.5-6c1.6-1.9 3.5-.8 3.5.9v13.9c0 1.7-1.9 2.8-3.5.9z"/>
              <path fill="#f44336" d="M31.2 24L5.2-.1c.3 0 .6-.1.9-.2L31.2 24z"/>
            </svg>
            <div className="flex flex-col items-start leading-none text-left">
              <span className="text-[10px] text-neutral-400 font-medium">GET IT ON</span>
              <span className="text-sm font-semibold tracking-wide">Google Play</span>
            </div>
          </button>
        </footer>
        
      </div>
    </div>
  );
};
