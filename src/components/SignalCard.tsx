import React, { useState, useEffect } from 'react';
import { SignalData } from '../types';
import { ArrowUp, ArrowDown, Minus, Lock, Clock, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface SignalCardProps {
  data: SignalData;
  lotSize?: number;
}

export const SignalCard: React.FC<SignalCardProps> = ({ data, lotSize }) => {
  const isBuy = data.signal === 'buy';
  const isSell = data.signal === 'sell';
  const isNeutral = data.signal === 'neutral';
  const isLocked = data.locked;

  const [now, setNow] = useState(Date.now());
  const [showTradeModal, setShowTradeModal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCountdown = (targetTime: number) => {
    const diff = targetTime - now;
    if (diff <= 0) return '00:00:00';
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getTradeLevels = () => {
    const isJpy = data.pair.includes('JPY');
    const pointMultiplier = isJpy ? 0.001 : 0.00001;
    const slPoints = 650;
    const tpPoints = 180;
    const decimals = isJpy ? 3 : 5;

    const currentLotSize = lotSize || 0;
    const pointValuePerLot = 1;
    const estProfit = (tpPoints * currentLotSize * pointValuePerLot).toFixed(2);
    const estLoss = (slPoints * currentLotSize * pointValuePerLot).toFixed(2);

    if (data.signal === 'buy') {
      return {
        type: 'BUY',
        entry: data.close.toFixed(decimals),
        sl: (data.close - slPoints * pointMultiplier).toFixed(decimals),
        tp: (data.close + tpPoints * pointMultiplier).toFixed(decimals),
        estProfit,
        estLoss,
      };
    } else {
      return {
        type: 'SELL',
        entry: data.close.toFixed(decimals),
        sl: (data.close + slPoints * pointMultiplier).toFixed(decimals),
        tp: (data.close - tpPoints * pointMultiplier).toFixed(decimals),
        estProfit,
        estLoss,
      };
    }
  };

  const tradeLevels = getTradeLevels();

  return (
    <>
      <div className={cn(
        "relative overflow-hidden rounded-2xl border p-5 transition-all flex flex-col justify-between h-full",
        isLocked ? "border-amber-500/30 bg-amber-500/5 opacity-80 grayscale-[30%]" :
        isBuy ? "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : 
        isSell ? "border-rose-500/50 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.1)]" : 
        "border-neutral-800 bg-neutral-900/50"
      )}>
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold tracking-tight text-white">{data.pair}</h3>
            {lotSize !== undefined && lotSize > 0 && !isLocked && (
              <span className="text-sm font-bold bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-500/30 shadow-sm">
                {lotSize.toFixed(2)} Lot
              </span>
            )}
            {isLocked && (
              <div className="bg-amber-500/20 text-amber-500 p-1 rounded-md" title={data.lockReason || 'Locked due to news'}>
                <Lock size={14} />
              </div>
            )}
          </div>
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full",
            isLocked ? "bg-amber-500/10 text-amber-500/50" :
            isBuy ? "bg-emerald-500/20 text-emerald-400" :
            isSell ? "bg-rose-500/20 text-rose-400" :
            "bg-neutral-800 text-neutral-400"
          )}>
            {isLocked ? <Lock size={16} /> : (
              <>
                {isBuy && <ArrowUp size={18} strokeWidth={3} />}
                {isSell && <ArrowDown size={18} strokeWidth={3} />}
                {isNeutral && <Minus size={18} strokeWidth={3} />}
              </>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-sm font-medium text-neutral-400">Close</span>
            <span className="text-base font-semibold text-neutral-200">{data.close.toFixed(4)}</span>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-neutral-400">%K (8)</span>
              <span className={cn("font-mono font-medium", 
                isLocked ? "text-neutral-500" : data.k <= 5 ? "text-emerald-400" : data.k >= 95 ? "text-rose-400" : "text-neutral-300"
              )}>
                {data.k.toFixed(2)}
              </span>
            </div>
            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full transition-all duration-500", 
                  isLocked ? "bg-neutral-600" : data.k <= 5 ? "bg-emerald-400" : data.k >= 95 ? "bg-rose-400" : "bg-neutral-500"
                )} 
                style={{ width: `${Math.max(0, Math.min(100, data.k))}%` }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-neutral-400">%D (3)</span>
              <span className={cn("font-mono font-medium", 
                isLocked ? "text-neutral-500" : data.d <= 5 ? "text-emerald-400" : data.d >= 95 ? "text-rose-400" : "text-neutral-300"
              )}>
                {data.d.toFixed(2)}
              </span>
            </div>
            <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full transition-all duration-500", 
                  isLocked ? "bg-neutral-600" : data.d <= 5 ? "bg-emerald-400" : data.d >= 95 ? "bg-rose-400" : "bg-neutral-500"
                )} 
                style={{ width: `${Math.max(0, Math.min(100, data.d))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-neutral-800/50 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Signal</span>
          <span className={cn("text-xs font-bold uppercase tracking-widest",
            isLocked ? "text-amber-500" :
            isBuy ? "text-emerald-400" : isSell ? "text-rose-400" : "text-neutral-500"
          )}>
            {isLocked ? "Locked (News)" : isBuy ? "Strong Buy" : isSell ? "Strong Sell" : "Neutral"}
          </span>
        </div>

        {!isLocked && !isNeutral && (
          <button 
            onClick={() => setShowTradeModal(true)}
            className={cn(
              "w-full py-2.5 rounded-xl text-sm font-bold tracking-wide text-white uppercase transition-colors",
              isBuy ? "bg-emerald-500 hover:bg-emerald-400" : "bg-rose-500 hover:bg-rose-400"
            )}
          >
            {isBuy ? 'EXECUTE BUY' : 'EXECUTE SELL'}
          </button>
        )}

        {isLocked && data.lockReason && (
          <div className="text-xs text-amber-500/80 leading-tight flex flex-col gap-1.5 mt-2 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
            <span>{data.lockReason}</span>
            {data.lockEndTime && (
              <span className="font-mono font-semibold flex items-center gap-1.5 text-amber-400">
                <Clock size={12} /> Unlocks in: {formatCountdown(data.lockEndTime)}
              </span>
            )}
          </div>
        )}

        {!isLocked && data.nextNewsTime && data.nextNewsTitle && (
          <div className="text-xs text-blue-400/80 leading-tight flex flex-col gap-1.5 mt-2 bg-blue-500/10 p-2.5 rounded-lg border border-blue-500/20">
            <span>Next News: {data.nextNewsTitle}</span>
            <span className="font-mono font-semibold flex items-center gap-1.5 text-blue-300">
              <Clock size={12} /> {formatCountdown(data.nextNewsTime)}
            </span>
          </div>
        )}
      </div>
    </div>

    {showTradeModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="relative w-full max-w-sm p-6 rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl">
          <button 
            onClick={() => setShowTradeModal(false)}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col gap-6 pt-2">
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">{data.pair}</h3>
              <p className={cn("text-sm font-semibold uppercase tracking-widest",
                tradeLevels.type === 'BUY' ? "text-emerald-400" : "text-rose-400"
              )}>
                Suggested {tradeLevels.type} Order
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end pb-3 border-b border-neutral-800/60">
                <span className="text-sm font-medium text-neutral-400 uppercase tracking-widest">Entry</span>
                <span className="text-xl font-mono text-white">{tradeLevels.entry}</span>
              </div>
              <div className="flex justify-between items-end pb-3 border-b border-neutral-800/60">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-neutral-400 uppercase tracking-widest">Take Profit</span>
                  {lotSize !== undefined && lotSize > 0 && (
                    <span className="text-xs text-emerald-500/80 mt-0.5">Est. Profit: +${tradeLevels.estProfit}</span>
                  )}
                </div>
                <span className="text-xl font-mono text-emerald-400">{tradeLevels.tp}</span>
              </div>
              <div className="flex justify-between items-end pb-3 border-b border-neutral-800/60">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-neutral-400 uppercase tracking-widest">Stop Loss</span>
                  {lotSize !== undefined && lotSize > 0 && (
                    <span className="text-xs text-rose-500/80 mt-0.5">Est. Loss: -${tradeLevels.estLoss}</span>
                  )}
                </div>
                <span className="text-xl font-mono text-rose-400">{tradeLevels.sl}</span>
              </div>
            </div>

            <button 
              onClick={() => setShowTradeModal(false)}
              className="w-full py-3.5 mt-2 rounded-xl text-sm font-bold tracking-widest text-neutral-900 uppercase transition-colors bg-white hover:bg-neutral-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
};
