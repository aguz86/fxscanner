const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `          const atr14 = calculateATR(quotesClean, 14);
          const atr50 = calculateATR(quotesClean, 50);
          const isVolatile = atr14 > atr50; // Simple check if current ATR is above average ATR`;

const replacement = `          const atr14 = calculateATR(quotesClean, 14);
          const atr50 = calculateATR(quotesClean, 50);
          const isVolatile = atr14 > atr50; // Simple check if current ATR is above average ATR
          
          // ATR Filter: only take signal if current ATR 14 is > 0.8 * previous ATR 14
          const prevAtr14 = calculateATR(quotesClean.slice(0, -1), 14);
          const hasSufficientVolatility = atr14 > (0.8 * prevAtr14);`;

code = code.replace(targetStr, replacement);

const targetSignalStr = `          // Only send signal if not locked by news
          if (!newsLock.locked) {
            if (stoch.k <= oversold || stoch.d <= oversold) signal = 'buy';
            else if (stoch.k >= overbought || stoch.d >= overbought) signal = 'sell';
          }`;

const replacementSignal = `          // Only send signal if not locked by news AND passes ATR volatility filter
          if (!newsLock.locked && hasSufficientVolatility) {
            if (stoch.k <= oversold || stoch.d <= oversold) signal = 'buy';
            else if (stoch.k >= overbought || stoch.d >= overbought) signal = 'sell';
          }`;

code = code.replace(targetSignalStr, replacementSignal);

fs.writeFileSync('server.ts', code);
console.log('Patched');
