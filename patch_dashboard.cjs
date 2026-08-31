const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const targetStr = `      results.forEach(pair => {
         if (pair.signal !== 'neutral') {
            if (pair.isVolatile) {
              pair.pendingMessage = \`Ada sinyal \${pair.signal} di pair \${pair.pair} nih. Market lagi volatil, \${pair.signal} stop dulu 140 poin & TP 140 poin yuk. Sekalian pasang \${pair.signal === 'buy' ? 'sell' : 'buy'} limit 10 poin dari jarak TP dengan target TP 200 poin. SL 850 poin.\`;
            } else {
              pair.pendingMessage = \`Ada sinyal \${pair.signal} di pair \${pair.pair} nih. Market lagi kurang volatil, \${pair.signal} stop dulu 100 poin & TP 100 poin yuk. Sekalian pasang \${pair.signal === 'buy' ? 'sell' : 'buy'} limit 10 poin dari jarak TP dengan target TP 200 poin. SL 850 poin.\`;
            }
         }
      });`;

const replacement = `      results.forEach(pair => {
         if (pair.signal !== 'neutral') {
            if (pair.signal === 'buy') {
              pair.pendingMessage = \`Ada sinyal BUY di pair \${pair.pair}. Logika: Harga turun dulu ke support, lalu naik breakout. Pasang BUY STOP di harga saat ini. TP1 +90 poin. Pasang BUY LIMIT 10 poin di atas TP1, dengan target TP2 +200 poin. SL 850 poin.\`;
            } else {
              pair.pendingMessage = \`Ada sinyal SELL di pair \${pair.pair}. Logika: Harga naik dulu ke resistance, lalu turun breakdown. Pasang SELL STOP di harga saat ini. TP1 -90 poin. Pasang SELL LIMIT 10 poin di bawah TP1, dengan target TP2 -200 poin. SL 850 poin.\`;
            }
         }
      });`;

code = code.replace(targetStr, replacement);
fs.writeFileSync('src/components/Dashboard.tsx', code);
console.log('Dashboard Patched');
