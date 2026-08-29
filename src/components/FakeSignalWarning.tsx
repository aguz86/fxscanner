import React, { useState, useEffect } from 'react';
import { getFakeSignalWarningState } from '../utils/maintenance';
import { AlertOctagon, X } from 'lucide-react';

export const FakeSignalWarning: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Initial check
    if (getFakeSignalWarningState()) {
      setIsVisible(true);
    }

    // Check every 3 minutes
    const interval = setInterval(() => {
      if (getFakeSignalWarningState()) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    }, 3 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-in fade-in duration-300">
      <div className="bg-neutral-900 border-2 border-rose-500/50 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-[0_0_40px_-10px_rgba(244,63,94,0.3)] relative text-center">
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
        
        <div className="mx-auto w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mb-5">
          <AlertOctagon size={32} className="text-rose-500 animate-pulse" />
        </div>
        
        <h2 className="text-xl font-bold text-white mb-3 tracking-wide">Peringatan Market!</h2>
        
        <p className="text-neutral-300 text-sm leading-relaxed mb-6 font-semibold uppercase tracking-wider text-rose-200">
          AWAS FAKE SIGNAL JANGAN PAKSA ENTRY SAAT NOTIF INI MUNCUL
        </p>
        
        <button 
          onClick={() => setIsVisible(false)}
          className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold tracking-wide uppercase py-3 rounded-xl transition-colors"
        >
          SAYA MENGERTI
        </button>
      </div>
    </div>
  );
};
