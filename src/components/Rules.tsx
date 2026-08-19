import React, { useState, useEffect } from 'react';
import { BookOpen, Activity, ShieldAlert, Clock } from 'lucide-react';

interface NewsEvent {
  title: string;
  country: string;
  date: string;
  impact: string;
}

export function Rules() {
  const [news, setNews] = useState<NewsEvent[]>([]);

  useEffect(() => {
    fetch('/api/news')
      .then(res => res.json())
      .then(data => setNews(data))
      .catch(console.error);
  }, []);

  const getSchedule = (keywords: string[], country?: string) => {
    const event = news.find(n => {
      const matchKeyword = keywords.some(k => n.title.toLowerCase().includes(k.toLowerCase()));
      if (country) {
        return matchKeyword && n.country === country;
      }
      return matchKeyword;
    });

    if (!event) return { jam: '-', hari: 'Tidak ada minggu ini' };

    const date = new Date(event.date);
    
    // Format jam (HH:mm) - using replace to ensure ':' separator instead of '.'
    const jam = date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false,
      timeZone: 'Asia/Jakarta' 
    }).replace(/\./g, ':');

    // Format tanggal (Hari, DD/MM/YYYY)
    const weekday = date.toLocaleDateString('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' });
    const day = date.toLocaleDateString('id-ID', { day: '2-digit', timeZone: 'Asia/Jakarta' });
    const month = date.toLocaleDateString('id-ID', { month: '2-digit', timeZone: 'Asia/Jakarta' });
    const year = date.toLocaleDateString('id-ID', { year: 'numeric', timeZone: 'Asia/Jakarta' });
    
    return {
      jam: jam,
      hari: `${weekday}, ${day}/${month}/${year}`
    };
  };

  return (
    <div className="flex-1 p-6 md:p-8 bg-black min-h-screen overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Rule & Parameter</h1>
            <p className="text-neutral-400">Penjelasan aturan teknikal dan filter berita yang aktif di dalam sistem</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Technical Rules */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                <Activity size={20} />
              </div>
              <h2 className="text-lg font-bold text-white">Indikator Teknikal (Stochastic)</h2>
            </div>
            <div className="space-y-4 text-neutral-300 text-sm">
              <p>
                Sistem menggunakan indikator <strong>Stochastic Oscillator</strong> untuk mendeteksi kondisi jenuh beli (overbought) dan jenuh jual (oversold).
              </p>
              <ul className="space-y-2 list-disc pl-5">
                <li><strong>Parameter Stochastic:</strong> %K = 8, %D = 3, Slowing = 3</li>
                <li>
                  <span className="text-green-400 font-semibold">Sinyal Buy (Strong Buy):</span> 
                  <br />Memicu sinyal beli ketika nilai %K atau %D berada di level <strong>5 atau lebih rendah</strong>.
                </li>
                <li>
                  <span className="text-red-400 font-semibold">Sinyal Sell (Strong Sell):</span> 
                  <br />Memicu sinyal jual ketika nilai %K atau %D berada di level <strong>95 atau lebih tinggi</strong>.
                </li>
              </ul>
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-xs text-blue-300">Sinyal indikator ini hanya akan dikeluarkan (valid) jika pair tidak sedang diblokir oleh aturan Filter Berita.</p>
              </div>
            </div>
          </div>

          {/* News Filter Overview */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                <ShieldAlert size={20} />
              </div>
              <h2 className="text-lg font-bold text-white">Filter Berita (High Impact)</h2>
            </div>
            <div className="space-y-4 text-neutral-300 text-sm">
              <p>
                Sistem secara otomatis menarik jadwal berita <strong>High Impact</strong>. Jika sebuah berita dirilis, pair yang terpengaruh akan berstatus <span className="text-amber-500 font-semibold">Locked (News)</span> dan sinyal dinetralkan.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* TIER 1 */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 md:p-6 border-b border-red-500/20 bg-red-500/5">
              <h2 className="text-lg font-bold text-red-400">TIER 1 - WAJIB OFF (24 Jam Sebelum & 8 Jam Sesudah)</h2>
              <p className="text-neutral-400 text-sm mt-1">Berita paling krusial, berdampak pada semua instrumen berbasis USD dan Indeks.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-950">
                  <tr>
                    <th className="py-3 px-6 text-neutral-400 font-semibold w-12">No</th>
                    <th className="py-3 px-6 text-neutral-400 font-semibold">News</th>
                    <th className="py-3 px-6 text-neutral-400 font-semibold">Jam WIB</th>
                    <th className="py-3 px-6 text-neutral-400 font-semibold">Tanggal</th>
                    <th className="py-3 px-6 text-neutral-400 font-semibold">Pair Yang Kena</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-neutral-300">
                  <tr className="hover:bg-neutral-800/50">
                    <td className="py-3 px-6">1</td>
                    <td className="py-3 px-6 font-medium text-white">FOMC Rate Decision</td>
                    <td className="py-3 px-6 text-neutral-400">{getSchedule(['fomc', 'federal funds rate']).jam}</td>
                    <td className="py-3 px-6">{getSchedule(['fomc', 'federal funds rate']).hari}</td>
                    <td className="py-3 px-6 font-semibold text-red-400">Semua pair USD + NASDAQ</td>
                  </tr>
                  <tr className="hover:bg-neutral-800/50">
                    <td className="py-3 px-6">2</td>
                    <td className="py-3 px-6 font-medium text-white">NFP</td>
                    <td className="py-3 px-6 text-neutral-400">{getSchedule(['nfp', 'non-farm', 'nonfarm', 'employment change'], 'USD').jam}</td>
                    <td className="py-3 px-6">{getSchedule(['nfp', 'non-farm', 'nonfarm', 'employment change'], 'USD').hari}</td>
                    <td className="py-3 px-6 font-semibold text-red-400">Semua pair USD + NASDAQ</td>
                  </tr>
                  <tr className="hover:bg-neutral-800/50">
                    <td className="py-3 px-6">3</td>
                    <td className="py-3 px-6 font-medium text-white">CPI AS</td>
                    <td className="py-3 px-6 text-neutral-400">{getSchedule(['cpi'], 'USD').jam}</td>
                    <td className="py-3 px-6">{getSchedule(['cpi'], 'USD').hari}</td>
                    <td className="py-3 px-6 font-semibold text-red-400">Semua pair USD + NASDAQ</td>
                  </tr>
                  <tr className="hover:bg-neutral-800/50">
                    <td className="py-3 px-6">4</td>
                    <td className="py-3 px-6 font-medium text-white">Core PCE</td>
                    <td className="py-3 px-6 text-neutral-400">{getSchedule(['core pce']).jam}</td>
                    <td className="py-3 px-6">{getSchedule(['core pce']).hari}</td>
                    <td className="py-3 px-6 font-semibold text-red-400">Semua pair USD + NASDAQ</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* TIER 2 */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 md:p-6 border-b border-amber-500/20 bg-amber-500/5">
              <h2 className="text-lg font-bold text-amber-400">TIER 2 - WAJIB OFF SESUAI NEGARA (18 Jam Sebelum & 6 Jam Sesudah)</h2>
              <p className="text-neutral-400 text-sm mt-1">Berita spesifik negara, berdampak langsung pada pasangan mata uang yang bersangkutan.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-950">
                  <tr>
                    <th className="py-3 px-6 text-neutral-400 font-semibold w-12">No</th>
                    <th className="py-3 px-6 text-neutral-400 font-semibold">News</th>
                    <th className="py-3 px-6 text-neutral-400 font-semibold">Jam WIB</th>
                    <th className="py-3 px-6 text-neutral-400 font-semibold">Tanggal</th>
                    <th className="py-3 px-6 text-neutral-400 font-semibold">Pair Yang Kena</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-neutral-300">
                  <tr className="hover:bg-neutral-800/50">
                    <td className="py-3 px-6">5</td>
                    <td className="py-3 px-6 font-medium text-white">CPI AUD + Employment AUD</td>
                    <td className="py-3 px-6 text-neutral-400">{getSchedule(['cpi', 'employment'], 'AUD').jam}</td>
                    <td className="py-3 px-6">{getSchedule(['cpi', 'employment'], 'AUD').hari}</td>
                    <td className="py-3 px-6 font-semibold text-amber-400">AUDUSD, AUDCAD, EURAUD, GBPAUD</td>
                  </tr>
                  <tr className="hover:bg-neutral-800/50">
                    <td className="py-3 px-6">6</td>
                    <td className="py-3 px-6 font-medium text-white">RBA Rate Decision</td>
                    <td className="py-3 px-6 text-neutral-400">{getSchedule(['rba', 'official bank rate'], 'AUD').jam}</td>
                    <td className="py-3 px-6">{getSchedule(['rba', 'official bank rate'], 'AUD').hari}</td>
                    <td className="py-3 px-6 font-semibold text-amber-400">AUDUSD, AUDCAD, EURAUD, GBPAUD</td>
                  </tr>
                  <tr className="hover:bg-neutral-800/50">
                    <td className="py-3 px-6">7</td>
                    <td className="py-3 px-6 font-medium text-white">CPI GBP</td>
                    <td className="py-3 px-6 text-neutral-400">{getSchedule(['cpi'], 'GBP').jam}</td>
                    <td className="py-3 px-6">{getSchedule(['cpi'], 'GBP').hari}</td>
                    <td className="py-3 px-6 font-semibold text-amber-400">GBPUSD, GBPCAD, GBPCHF, GBPAUD, EURUSD</td>
                  </tr>
                  <tr className="hover:bg-neutral-800/50">
                    <td className="py-3 px-6">8</td>
                    <td className="py-3 px-6 font-medium text-white">BoE Rate Decision</td>
                    <td className="py-3 px-6 text-neutral-400">{getSchedule(['boe', 'official bank rate'], 'GBP').jam}</td>
                    <td className="py-3 px-6">{getSchedule(['boe', 'official bank rate'], 'GBP').hari}</td>
                    <td className="py-3 px-6 font-semibold text-amber-400">GBPUSD, GBPCAD, GBPCHF, GBPAUD</td>
                  </tr>
                  <tr className="hover:bg-neutral-800/50">
                    <td className="py-3 px-6">9</td>
                    <td className="py-3 px-6 font-medium text-white">CPI EUR</td>
                    <td className="py-3 px-6 text-neutral-400">{getSchedule(['cpi'], 'EUR').jam}</td>
                    <td className="py-3 px-6">{getSchedule(['cpi'], 'EUR').hari}</td>
                    <td className="py-3 px-6 font-semibold text-amber-400">EURUSD, EURCAD, EURAUD</td>
                  </tr>
                  <tr className="hover:bg-neutral-800/50">
                    <td className="py-3 px-6">10</td>
                    <td className="py-3 px-6 font-medium text-white">ECB Rate Decision</td>
                    <td className="py-3 px-6 text-neutral-400">{getSchedule(['ecb', 'main refinancing rate'], 'EUR').jam}</td>
                    <td className="py-3 px-6">{getSchedule(['ecb', 'main refinancing rate'], 'EUR').hari}</td>
                    <td className="py-3 px-6 font-semibold text-amber-400">EURUSD, EURCAD, EURAUD</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* TIER 3 */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 md:p-6 border-b border-blue-500/20 bg-blue-500/5">
              <h2 className="text-lg font-bold text-blue-400">TIER 3 - WAJIB OFF TAMBAHAN AS (14 Jam Sebelum & 4 Jam Sesudah)</h2>
              <p className="text-neutral-400 text-sm mt-1">Berita penunjang USD yang sering memberikan lonjakan volatilitas sekunder.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-950">
                  <tr>
                    <th className="py-3 px-6 text-neutral-400 font-semibold w-12">No</th>
                    <th className="py-3 px-6 text-neutral-400 font-semibold">News</th>
                    <th className="py-3 px-6 text-neutral-400 font-semibold">Jam WIB</th>
                    <th className="py-3 px-6 text-neutral-400 font-semibold">Tanggal</th>
                    <th className="py-3 px-6 text-neutral-400 font-semibold">Pair Yang Kena</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-neutral-300">
                  <tr className="hover:bg-neutral-800/50">
                    <td className="py-3 px-6">11</td>
                    <td className="py-3 px-6 font-medium text-white">
                      Initial Jobless Claims
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">Baru</span>
                    </td>
                    <td className="py-3 px-6 text-neutral-400">{getSchedule(['jobless claim', 'unemployment claim']).jam}</td>
                    <td className="py-3 px-6">{getSchedule(['jobless claim', 'unemployment claim']).hari}</td>
                    <td className="py-3 px-6 font-semibold text-blue-400">Semua pair USD + NASDAQ</td>
                  </tr>
                  <tr className="hover:bg-neutral-800/50">
                    <td className="py-3 px-6">12</td>
                    <td className="py-3 px-6 font-medium text-white">
                      JOLTs Job Openings
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">Baru</span>
                    </td>
                    <td className="py-3 px-6 text-neutral-400">{getSchedule(['jolt']).jam}</td>
                    <td className="py-3 px-6">{getSchedule(['jolt']).hari}</td>
                    <td className="py-3 px-6 font-semibold text-blue-400">EURUSD, AUDUSD, GBPUSD, NASDAQ</td>
                  </tr>
                  <tr className="hover:bg-neutral-800/50">
                    <td className="py-3 px-6">13</td>
                    <td className="py-3 px-6 font-medium text-white">Retail Sales AS</td>
                    <td className="py-3 px-6 text-neutral-400">{getSchedule(['retail sales'], 'USD').jam}</td>
                    <td className="py-3 px-6">{getSchedule(['retail sales'], 'USD').hari}</td>
                    <td className="py-3 px-6 font-semibold text-blue-400">Semua pair USD + NASDAQ</td>
                  </tr>
                  <tr className="hover:bg-neutral-800/50">
                    <td className="py-3 px-6">14</td>
                    <td className="py-3 px-6 font-medium text-white">PPI AS</td>
                    <td className="py-3 px-6 text-neutral-400">{getSchedule(['ppi'], 'USD').jam}</td>
                    <td className="py-3 px-6">{getSchedule(['ppi'], 'USD').hari}</td>
                    <td className="py-3 px-6 font-semibold text-blue-400">Semua pair USD + NASDAQ</td>
                  </tr>
                  <tr className="hover:bg-neutral-800/50">
                    <td className="py-3 px-6">15</td>
                    <td className="py-3 px-6 font-medium text-white">ISM PMI AS</td>
                    <td className="py-3 px-6 text-neutral-400">{getSchedule(['ism pmi'], 'USD').jam}</td>
                    <td className="py-3 px-6">{getSchedule(['ism pmi'], 'USD').hari}</td>
                    <td className="py-3 px-6 font-semibold text-blue-400">EURUSD, AUDUSD, GBPUSD, NASDAQ</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
