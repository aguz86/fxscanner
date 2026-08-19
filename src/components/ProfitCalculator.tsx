import React, { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';
import { SignalData } from '../types';

interface ProfitCalculatorProps {
  currentRates?: SignalData[];
}

export const ProfitCalculator: React.FC<ProfitCalculatorProps> = ({ currentRates = [] }) => {
  const PAIRS = [
    'EURUSD', 'AUDUSD', 'GBPUSD', 'GBPAUD', 'EURAUD',
    'EURCAD', 'AUDCAD', 'GBPCAD', 'USDCHF', 'GBPCHF', 'NASDAQ'
  ];

  const [rates, setRates] = useState<SignalData[]>(currentRates);
  const [loading, setLoading] = useState<boolean>(currentRates.length === 0);
  const [pair, setPair] = useState<string>('EURUSD');
  const [action, setAction] = useState<'buy' | 'sell'>('buy');
  const [volume, setVolume] = useState<number>(0.01);
  const [openPrice, setOpenPrice] = useState<number | ''>('');
  const [tpPoints, setTpPoints] = useState<number | ''>('');
  const [slPoints, setSlPoints] = useState<number | ''>('');

  const isNasdaq = pair === 'NASDAQ';
  const pointMultiplier = isNasdaq ? 1.0 : 0.00001;
  const contractSize = isNasdaq ? 1 : 100000;
  const priceDecimals = isNasdaq ? 2 : 5;

  useEffect(() => {
    if (currentRates.length > 0) {
      setRates(currentRates);
      setLoading(false);
      return;
    }

    const fetchRates = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/signals?timeframe=15m');
        if (response.ok) {
          const data: SignalData[] = await response.json();
          setRates(data);
          
          // Set initial prices for default pair
          const defaultRate = data.find(r => r.pair === pair);
          if (defaultRate && openPrice === '') {
            setOpenPrice(Number(defaultRate.close.toFixed(priceDecimals)));
          }
        }
      } catch (error) {
        console.error('Failed to fetch rates', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, [currentRates]);

  // Set default open price when pair changes based on current rate
  useEffect(() => {
    const rate = rates.find(r => r.pair === pair);
    if (rate && openPrice === '') {
      setOpenPrice(Number(rate.close.toFixed(priceDecimals)));
    }
  }, [rates, pair]); // Auto-fill on initial rates load or pair change

  const calculateProfitByPoints = (points: number | '') => {
    if (points === '' || !volume) return 0;
    const priceDiff = points * pointMultiplier;
    let profitQuote = priceDiff * volume * contractSize;
    
    if (isNasdaq) return profitQuote; // NASDAQ is quoted in USD

    const quoteCurrency = pair.substring(3, 6);
    if (quoteCurrency === 'USD') return profitQuote;
    if (quoteCurrency === 'AUD') {
      const audUsd = rates.find(r => r.pair === 'AUDUSD');
      return audUsd ? profitQuote * audUsd.close : 0;
    }
    if (quoteCurrency === 'CAD') {
      const eurUsd = rates.find(r => r.pair === 'EURUSD');
      const eurCad = rates.find(r => r.pair === 'EURCAD');
      if (eurUsd && eurCad) {
        return profitQuote / (eurCad.close / eurUsd.close);
      }
      return 0;
    }
    if (quoteCurrency === 'CHF') {
      const usdChf = rates.find(r => r.pair === 'USDCHF');
      return usdChf ? profitQuote / usdChf.close : 0;
    }
    return profitQuote;
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-indigo-500/10 rounded-xl">
            <Calculator className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Profit Calculator</h1>
            <p className="text-sm text-neutral-400">Calculate potential profit or loss</p>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-5">
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setAction('buy')}
                    className={`py-3 px-4 rounded-xl font-bold tracking-wider uppercase transition-colors border ${
                      action === 'buy' 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' 
                        : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setAction('sell')}
                    className={`py-3 px-4 rounded-xl font-bold tracking-wider uppercase transition-colors border ${
                      action === 'sell' 
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/50' 
                        : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    Sell
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Currency Pair</label>
                  <select 
                    value={pair}
                    onChange={(e) => {
                      setPair(e.target.value);
                      const rate = rates.find(r => r.pair === e.target.value);
                      if (rate) {
                        const decimals = e.target.value === 'NASDAQ' ? 2 : 5;
                        setOpenPrice(Number(rate.close.toFixed(decimals)));
                      }
                    }}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    {PAIRS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Volume (Lots)</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Open Price</label>
                  <input 
                    type="number"
                    step={pointMultiplier}
                    value={openPrice}
                    onChange={(e) => setOpenPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-emerald-400/80 uppercase tracking-wider">TP (Points)</label>
                    <input 
                      type="number"
                      step="1"
                      min="0"
                      value={tpPoints}
                      onChange={(e) => setTpPoints(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 200"
                      className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-rose-400/80 uppercase tracking-wider">SL (Points)</label>
                    <input 
                      type="number"
                      step="1"
                      min="0"
                      value={slPoints}
                      onChange={(e) => setSlPoints(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 100"
                      className="w-full bg-rose-500/5 border border-rose-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500/50 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center items-center bg-neutral-950 border border-neutral-800 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-20"></div>
                
                <div className="text-center space-y-4 z-10 w-full">
                  <div className="text-sm font-semibold text-neutral-500 uppercase tracking-widest">Scenario Analysis</div>
                  
                  <div className="w-full space-y-4 text-left mt-6">
                    {tpPoints !== '' && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-xs text-emerald-400/80 uppercase tracking-wider">Take Profit ({tpPoints} pts)</div>
                            <div className="text-sm font-mono text-emerald-400/80">
                                @ {openPrice !== '' ? (action === 'buy' ? openPrice + tpPoints * pointMultiplier : openPrice - tpPoints * pointMultiplier).toFixed(priceDecimals) : '-'}
                            </div>
                        </div>
                        <div className="font-mono text-3xl text-emerald-400 font-bold">
                          +${calculateProfitByPoints(tpPoints).toFixed(2)}
                        </div>
                      </div>
                    )}
                    {slPoints !== '' && (
                      <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-xs text-rose-400/80 uppercase tracking-wider">Stop Loss ({slPoints} pts)</div>
                            <div className="text-sm font-mono text-rose-400/80">
                                @ {openPrice !== '' ? (action === 'buy' ? openPrice - slPoints * pointMultiplier : openPrice + slPoints * pointMultiplier).toFixed(priceDecimals) : '-'}
                            </div>
                        </div>
                        <div className="font-mono text-3xl text-rose-400 font-bold">
                          -${calculateProfitByPoints(slPoints).toFixed(2)}
                        </div>
                      </div>
                    )}
                    
                    {(tpPoints === '' && slPoints === '') && (
                      <div className="py-8 text-center text-neutral-500 text-sm">
                        Enter TP or SL points to see potential profit and loss scenarios.
                      </div>
                    )}
                    
                    <div className="pt-8 border-t border-neutral-800/50 w-full grid grid-cols-2 gap-4 text-left">
                      <div>
                        <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Contract Size</div>
                        <div className="font-mono text-sm">{contractSize.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Account Currency</div>
                        <div className="font-mono text-sm">USD</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Point Value (1 Lot)</div>
                        <div className="font-mono text-sm">
                          ${(calculateProfitByPoints(1) / (volume || 1)).toFixed(priceDecimals)} / point
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

