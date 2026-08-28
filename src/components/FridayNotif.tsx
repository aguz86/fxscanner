import React, { useState, useEffect } from 'react';
import { getWIBDate } from '../utils/maintenance';
import { AlertCircle, X } from 'lucide-react';

export const FridayNotif: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const wib = getWIBDate();
    const dateStr = wib.toISOString().split('T')[0]; // YYYY-MM-DD
    const storageKey = `fridayNotifDismissed_${dateStr}`;
    
    if (!localStorage.getItem(storageKey)) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    const wib = getWIBDate();
    const dateStr = wib.toISOString().split('T')[0];
    localStorage.setItem(`fridayNotifDismissed_${dateStr}`, 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[999] animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className="bg-neutral-900 border border-indigo-500/30 rounded-2xl p-5 shadow-2xl max-w-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
        
        <button 
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-neutral-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 mt-1 flex-shrink-0">
            <AlertCircle size={20} />
          </div>
          <div>
            <h3 className="text-white font-bold tracking-wide mb-1">Khusus Hari Jumat!</h3>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Target Profit (TP) pagi ini hanya <span className="font-bold text-white bg-white/10 px-1 py-0.5 rounded">120 poin</span> dan TP sore jumat adalah <span className="font-bold text-white bg-white/10 px-1 py-0.5 rounded">50 poin</span>.
            </p>
            <button 
              onClick={handleDismiss}
              className="mt-3 text-xs font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Mengerti
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
