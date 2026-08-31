const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
code = code.replace(
  "      const results: SignalData[] = await response.json();\n\n      if (timeframe === '15m') {",
`      const results: SignalData[] = await response.json();

      results.forEach(pair => {
         if (pair.signal !== 'neutral') {
            if (pair.isVolatile) {
              pair.pendingMessage = \`Ada sinyal \${pair.signal} di pair \${pair.pair} nih. Market lagi volatil, \${pair.signal} stop dulu 140 poin & TP 140 poin yuk. Sekalian pasang \${pair.signal} limit 10 poin dari jarak TP dengan target TP 200 poin. SL 850 poin.\`;
            } else {
              pair.pendingMessage = \`Ada sinyal \${pair.signal} di pair \${pair.pair} nih. Market lagi kurang volatil, \${pair.signal} stop dulu 100 poin & TP 100 poin yuk. Sekalian pasang \${pair.signal} limit 10 poin dari jarak TP dengan target TP 200 poin. SL 850 poin.\`;
            }
         }
      });

      if (timeframe === '15m') {`
);
fs.writeFileSync('src/components/Dashboard.tsx', code);
