import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

export const MaintenanceScreen: React.FC<{ targetTime: Date }> = ({ targetTime }) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const calcTimeLeft = () => {
      const diff = targetTime.getTime() - Date.now();
      if (diff <= 0) {
        window.location.reload(); // Reload to remove maintenance block
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    };

    calcTimeLeft();
    const interval = setInterval(calcTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  if (!timeLeft) return null;

  return (
    <main className="fixed inset-0 z-[9999] bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden">
      <div className="absolute inset-0 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="relative z-10 w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-6 border border-rose-500/20">
          <AlertTriangle className="text-rose-400" size={32} />
        </div>
        
        <h1 className="text-3xl font-extrabold tracking-tight mb-3">Market Closed</h1>
        <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
          Sistem sedang dalam mode maintenance atau market forex sedang tutup. Silakan kembali saat market aktif.
        </p>
        
        <div className="w-full bg-neutral-950 rounded-2xl p-6 border border-neutral-800/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
          <div className="flex items-center justify-center gap-2 mb-4 text-indigo-400 font-semibold tracking-wider text-xs uppercase">
            <Clock size={14} />
            <span>Waktu Tersisa</span>
          </div>
          
          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col items-center">
              <span className="text-4xl font-black font-mono text-white">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-neutral-500 mt-1">Jam</span>
            </div>
            <span className="text-3xl font-black text-neutral-700 pb-4">:</span>
            <div className="flex flex-col items-center">
              <span className="text-4xl font-black font-mono text-white">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-neutral-500 mt-1">Menit</span>
            </div>
            <span className="text-3xl font-black text-neutral-700 pb-4">:</span>
            <div className="flex flex-col items-center">
              <span className="text-4xl font-black font-mono text-emerald-400">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-neutral-500 mt-1">Detik</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
