const data = [
  { pair: 'EURUSD', close: 1.1000 },
  { pair: 'AUDUSD', close: 0.6500 },
  { pair: 'GBPUSD', close: 1.2500 },
  { pair: 'NZDUSD', close: 0.6000 },
  { pair: 'EURCAD', close: 1.4500 },
  { pair: 'AUDCAD', close: 0.8800 },
  { pair: 'GBPCAD', close: 1.7000 },
  { pair: 'USDCHF', close: 0.9000 },
  { pair: 'GBPCHF', close: 1.1200 },
  { pair: 'EURJPY', close: 160.00 },
  { pair: 'AUDJPY', close: 95.00 },
  { pair: 'CHFJPY', close: 170.00 },
  { pair: 'NASDAQ', close: 18000 }
];

const balance = 1000;
const riskPercent = 2;
const slPoints = 650;
const riskUsd = balance * (riskPercent / 100);

const getPrice = (p) => data.find(d => d.pair === p)?.close || 0;

const calculateLotSize = (pair) => {
    if (pair === 'NASDAQ') {
      let lossPerLotUsd = slPoints * 1;
      return riskUsd / lossPerLotUsd;
    }
    
    let quoteCurrency = pair.substring(3, 6);
    let baseCurrency = pair.substring(0, 3);
    
    let pointValueInQuote = quoteCurrency === 'JPY' ? 100 : 1;
    let lossInQuote = slPoints * pointValueInQuote;
    
    let lossPerLotUsd = 0;
    
    if (quoteCurrency === 'USD') {
      lossPerLotUsd = lossInQuote;
    } else {
      let usdQuote = getPrice(`USD${quoteCurrency}`); // e.g. USDCAD, USDJPY, USDCHF
      if (!usdQuote) {
        // Try to derive it from a base that has USD
        // e.g. for CAD: EURCAD and EURUSD -> USDCAD = EURCAD / EURUSD
        // e.g. for JPY: EURJPY and EURUSD -> USDJPY = EURJPY / EURUSD
        const eurQuote = getPrice(`EUR${quoteCurrency}`);
        const eurUsd = getPrice('EURUSD');
        if (eurQuote && eurUsd) {
          usdQuote = eurQuote / eurUsd;
        } else {
          const audQuote = getPrice(`AUD${quoteCurrency}`);
          const audUsd = getPrice('AUDUSD');
          if (audQuote && audUsd) {
            usdQuote = audQuote / audUsd;
          } else {
             const gbpQuote = getPrice(`GBP${quoteCurrency}`);
             const gbpUsd = getPrice('GBPUSD');
             if (gbpQuote && gbpUsd) {
               usdQuote = gbpQuote / gbpUsd;
             }
          }
        }
      }
      
      if (usdQuote) {
        lossPerLotUsd = lossInQuote / usdQuote;
      }
    }

    if (!lossPerLotUsd) return 0;
    return riskUsd / lossPerLotUsd;
};

data.forEach(d => {
  console.log(`${d.pair}: ${calculateLotSize(d.pair)}`);
});
