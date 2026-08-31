const fs = require('fs');
let code = fs.readFileSync('src/components/SignalCard.tsx', 'utf8');

const targetStr = `  const getPendingTradeLevels = () => {
    const isJpy = data.pair.includes('JPY');
    const pointMultiplier = isJpy ? 0.001 : 0.00001;
    const decimals = isJpy ? 3 : 5;
    const distancePoints = data.isVolatile ? 140 : 100;
    const slPoints = 850; // User specified 850 points
    
    if (data.signal === 'buy') {
       const stopEntry = currentPrice + (distancePoints * pointMultiplier);
       const stopTp = stopEntry + (distancePoints * pointMultiplier);
       const stopSl = stopEntry - (slPoints * pointMultiplier);
       
       const limitEntry = stopTp - (10 * pointMultiplier); // Jeda 10 poin dari TP Buy Stop
       const limitTp = limitEntry + (200 * pointMultiplier); // Target TP 200 poin
       const limitSl = limitEntry - (slPoints * pointMultiplier);

       return {
          stopType: 'BUY STOP',
          stopEntry: stopEntry.toFixed(decimals),
          stopTp: stopTp.toFixed(decimals),
          stopSl: stopSl.toFixed(decimals),
          limitType: 'BUY LIMIT',
          limitEntry: limitEntry.toFixed(decimals),
          limitTp: limitTp.toFixed(decimals),
          limitSl: limitSl.toFixed(decimals)
       };
    } else {
       const stopEntry = currentPrice - (distancePoints * pointMultiplier);
       const stopTp = stopEntry - (distancePoints * pointMultiplier);
       const stopSl = stopEntry + (slPoints * pointMultiplier);
       
       const limitEntry = stopTp + (10 * pointMultiplier); // Jeda 10 poin dari TP Sell Stop
       const limitTp = limitEntry - (200 * pointMultiplier); // Target TP 200 poin
       const limitSl = limitEntry + (slPoints * pointMultiplier);

       return {
          stopType: 'SELL STOP',
          stopEntry: stopEntry.toFixed(decimals),
          stopTp: stopTp.toFixed(decimals),
          stopSl: stopSl.toFixed(decimals),
          limitType: 'SELL LIMIT',
          limitEntry: limitEntry.toFixed(decimals),
          limitTp: limitTp.toFixed(decimals),
          limitSl: limitSl.toFixed(decimals)
       };
    }
  };`;

const replacement = `  const getPendingTradeLevels = () => {
    const isJpy = data.pair.includes('JPY');
    const pointMultiplier = isJpy ? 0.001 : 0.00001;
    const decimals = isJpy ? 3 : 5;
    const slPoints = 850; // User specified 850 points
    
    if (data.signal === 'buy') {
       const stopEntry = currentPrice;
       const stopTp = stopEntry + (90 * pointMultiplier);
       const stopSl = stopEntry - (slPoints * pointMultiplier);
       
       const limitEntry = stopTp + (10 * pointMultiplier); // 10 poin di atas TP1
       const limitTp = limitEntry + (200 * pointMultiplier); // Target TP 200 poin
       const limitSl = limitEntry - (slPoints * pointMultiplier);

       return {
          stopType: 'BUY STOP',
          stopEntry: stopEntry.toFixed(decimals),
          stopTp: stopTp.toFixed(decimals),
          stopSl: stopSl.toFixed(decimals),
          limitType: 'BUY LIMIT',
          limitEntry: limitEntry.toFixed(decimals),
          limitTp: limitTp.toFixed(decimals),
          limitSl: limitSl.toFixed(decimals)
       };
    } else {
       const stopEntry = currentPrice;
       const stopTp = stopEntry - (90 * pointMultiplier);
       const stopSl = stopEntry + (slPoints * pointMultiplier);
       
       const limitEntry = stopTp - (10 * pointMultiplier); // 10 poin di bawah TP1
       const limitTp = limitEntry - (200 * pointMultiplier); // Target TP 200 poin
       const limitSl = limitEntry + (slPoints * pointMultiplier);

       return {
          stopType: 'SELL STOP',
          stopEntry: stopEntry.toFixed(decimals),
          stopTp: stopTp.toFixed(decimals),
          stopSl: stopSl.toFixed(decimals),
          limitType: 'SELL LIMIT',
          limitEntry: limitEntry.toFixed(decimals),
          limitTp: limitTp.toFixed(decimals),
          limitSl: limitSl.toFixed(decimals)
       };
    }
  };`;

code = code.replace(targetStr, replacement);
fs.writeFileSync('src/components/SignalCard.tsx', code);
console.log('SignalCard Patched');
