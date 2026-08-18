import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, AlertTriangle, ArrowRight, Search } from 'lucide-react';

interface NewsEvent {
  title: string;
  country: string;
  date: string;
  impact: string;
  forecast: string;
  previous: string;
  actual?: string;
}

export function Calendar() {
  const [news, setNews] = useState<NewsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('/api/news');
        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }
        const data = await response.json();
        
        // Sort by date descending (upcoming at the top, oldest at the bottom)
        data.sort((a: NewsEvent, b: NewsEvent) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setNews(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();

    // Poll every 60 seconds for real-time actual updates
    const intervalId = setInterval(fetchNews, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      dayStr: date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
      timeStr: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getCurrencyColor = (currency: string) => {
    const colors: Record<string, string> = {
      USD: 'text-green-400 bg-green-400/10 border-green-400/20',
      EUR: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
      GBP: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
      JPY: 'text-red-400 bg-red-400/10 border-red-400/20',
      AUD: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
      CAD: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
      CHF: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
      NZD: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    };
    return colors[currency] || 'text-neutral-400 bg-neutral-800 border-neutral-700';
  };

  const filteredNews = news.filter((item) => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex-1 p-6 md:p-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6 md:p-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-red-400 bg-red-400/10 border border-red-400/20 p-4 rounded-xl flex items-center gap-2">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 bg-black min-h-screen overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
              <CalendarIcon size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Economic Calendar</h1>
              <p className="text-neutral-400">Jadwal Berita High Impact (Hingga 30 Hari Aktif)</p>
            </div>
          </div>
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input
              type="text"
              placeholder="Cari berita atau pair..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 bg-neutral-900 border border-neutral-800 text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {filteredNews.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center">
            <div className="text-neutral-500 mb-4 flex justify-center">
              <CalendarIcon size={48} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Tidak Ada Berita High Impact</h3>
            <p className="text-neutral-400">Tidak ada jadwal berita High Impact untuk periode aktif saat ini.</p>
          </div>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl shadow-black/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-950 border-b border-neutral-800">
                    <th className="py-4 px-6 font-semibold text-neutral-400 text-sm whitespace-nowrap">Tanggal & Waktu</th>
                    <th className="py-4 px-6 font-semibold text-neutral-400 text-sm">Mata Uang</th>
                    <th className="py-4 px-6 font-semibold text-neutral-400 text-sm">Event Berita</th>
                    <th className="py-4 px-6 font-semibold text-neutral-400 text-sm">Aktual (Actual)</th>
                    <th className="py-4 px-6 font-semibold text-neutral-400 text-sm">Prediksi (Forecast)</th>
                    <th className="py-4 px-6 font-semibold text-neutral-400 text-sm">Sebelumnya (Previous)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {filteredNews.map((item, index) => {
                    const { dayStr, timeStr } = formatDateTime(item.date);
                    const isPast = new Date(item.date).getTime() < Date.now();
                    
                    return (
                      <tr 
                        key={index} 
                        className={`group hover:bg-neutral-800/50 transition-colors ${isPast ? 'opacity-50' : ''}`}
                      >
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-white font-medium">{dayStr}</span>
                            <span className="text-neutral-400 text-sm flex items-center gap-1 mt-0.5">
                              <Clock size={12} /> {timeStr}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${getCurrencyColor(item.country)}`}>
                            {item.country}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`font-semibold ${isPast ? 'text-neutral-300' : 'text-white'}`}>
                              {item.title}
                            </span>
                            {item.impact === 'High' ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-wider">
                                <AlertTriangle size={10} />
                                High Impact
                              </span>
                            ) : item.impact === 'Medium' ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                                Medium Impact
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30 uppercase tracking-wider">
                                Low Impact
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`font-bold ${item.actual ? 'text-white' : 'text-neutral-500'}`}>
                            {item.actual || (isPast ? '-' : 'Waiting...')}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-neutral-300">{item.forecast || '-'}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-neutral-400">{item.previous || '-'}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
