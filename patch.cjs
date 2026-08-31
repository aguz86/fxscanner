const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
const searchString = "const results: SignalData[] = await response.json();";
const index = code.indexOf(searchString);
if (index !== -1) {
    const insertionPoint = index + searchString.length;
    const insertion = `

      results.forEach(pair => {
         if (pair.signal !== 'neutral') {
            if (pair.isVolatile) {
              pair.pendingMessage = \`Ada sinyal \${pair.signal} di pair \${pair.pair} nih. Market lagi volatil, \${pair.signal} stop dulu 140 poin & TP 140 poin yuk. Sekalian pasang \${pair.signal === 'buy' ? 'sell' : 'buy'} limit 10 poin dari jarak TP dengan target TP 200 poin. SL 850 poin.\`;
            } else {
              pair.pendingMessage = \`Ada sinyal \${pair.signal} di pair \${pair.pair} nih. Market lagi kurang volatil, \${pair.signal} stop dulu 100 poin & TP 100 poin yuk. Sekalian pasang \${pair.signal === 'buy' ? 'sell' : 'buy'} limit 10 poin dari jarak TP dengan target TP 200 poin. SL 850 poin.\`;
            }
         }
      });
`;
    code = code.slice(0, insertionPoint) + insertion + code.slice(insertionPoint);
    fs.writeFileSync('src/components/Dashboard.tsx', code);
    console.log('Patched');
} else {
    console.log('Not found');
}
