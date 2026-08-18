import React from 'react';
import { BookOpen, Activity, ShieldAlert, Clock } from 'lucide-react';

export function Rules() {
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
              <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <Clock size={14} className="text-neutral-400"/> Aturan Default:
                </h3>
                <p className="text-neutral-400 text-xs">
                  Berlaku untuk berita High Impact biasa. Hanya mengunci pair yang memiliki mata uang yang sama dengan berita.
                </p>
                <ul className="mt-2 text-xs space-y-1">
                  <li>• <strong className="text-white">Waktu Kunci Awal:</strong> 10 Jam sebelum rilis</li>
                  <li>• <strong className="text-white">Waktu Kunci Akhir:</strong> 6 Jam setelah rilis</li>
                  <li>• <strong className="text-white">Cakupan:</strong> Hanya pair terkait</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Specific News Rules Table */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-neutral-800">
            <h2 className="text-lg font-bold text-white">Aturan Khusus Berita Tertentu</h2>
            <p className="text-neutral-400 text-sm mt-1">Pengecualian waktu kunci (lock) untuk jenis berita yang sangat berdampak pada volatilitas pasar.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-950">
                <tr>
                  <th className="py-3 px-6 text-neutral-400 font-semibold">Jenis Berita</th>
                  <th className="py-3 px-6 text-neutral-400 font-semibold">Sebelum Rilis</th>
                  <th className="py-3 px-6 text-neutral-400 font-semibold">Setelah Rilis</th>
                  <th className="py-3 px-6 text-neutral-400 font-semibold">Cakupan Pair</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-neutral-300">
                <tr className="hover:bg-neutral-800/50">
                  <td className="py-3 px-6 font-medium text-white">Jobless Claim / Unemployment</td>
                  <td className="py-3 px-6">12 Jam</td>
                  <td className="py-3 px-6">6 Jam</td>
                  <td className="py-3 px-6">Hanya pair terkait</td>
                </tr>
                <tr className="hover:bg-neutral-800/50">
                  <td className="py-3 px-6 font-medium text-white">JOLTS</td>
                  <td className="py-3 px-6">14 Jam</td>
                  <td className="py-3 px-6">8 Jam</td>
                  <td className="py-3 px-6">Hanya pair terkait</td>
                </tr>
                <tr className="hover:bg-neutral-800/50">
                  <td className="py-3 px-6 font-medium text-white">Core PCE</td>
                  <td className="py-3 px-6">14 Jam</td>
                  <td className="py-3 px-6">8 Jam</td>
                  <td className="py-3 px-6 text-amber-400 font-semibold">Semua Pair</td>
                </tr>
                <tr className="hover:bg-neutral-800/50">
                  <td className="py-3 px-6 font-medium text-white">FOMC / Fed Funds Rate</td>
                  <td className="py-3 px-6">14 Jam</td>
                  <td className="py-3 px-6">8 Jam</td>
                  <td className="py-3 px-6 text-amber-400 font-semibold">Semua Pair</td>
                </tr>
                <tr className="hover:bg-neutral-800/50">
                  <td className="py-3 px-6 font-medium text-white">CPI</td>
                  <td className="py-3 px-6">20 Jam</td>
                  <td className="py-3 px-6">8 Jam</td>
                  <td className="py-3 px-6 text-amber-400 font-semibold">Semua Pair</td>
                </tr>
                <tr className="hover:bg-neutral-800/50">
                  <td className="py-3 px-6 font-medium text-white">NFP / Employment Change</td>
                  <td className="py-3 px-6">26 Jam</td>
                  <td className="py-3 px-6">8 Jam</td>
                  <td className="py-3 px-6 text-amber-400 font-semibold">Semua Pair</td>
                </tr>
                <tr className="hover:bg-neutral-800/50">
                  <td className="py-3 px-6 font-medium text-white">Khusus NASDAQ (Berita USD)</td>
                  <td className="py-3 px-6">16 Jam</td>
                  <td className="py-3 px-6">8 Jam</td>
                  <td className="py-3 px-6 text-indigo-400 font-semibold">Hanya NASDAQ</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
