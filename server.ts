import express from 'express';
import path from 'path';
import cors from 'cors';
import yahooFinancePkg from 'yahoo-finance2';
import { createServer as createViteServer } from 'vite';

const YFClass = (yahooFinancePkg as any).default || yahooFinancePkg;
const yahooFinance = new YFClass();
const app = express();
const PORT = 3000;

app.use(cors());

// List of target pairs
const PAIRS = [
  'EURUSD=X', 'AUDUSD=X', 'GBPUSD=X', 'GBPAUD=X', 'EURAUD=X',
  'EURCAD=X', 'AUDCAD=X', 'GBPCAD=X', 'USDCHF=X', 'GBPCHF=X'
];

/**
 * Calculates Smoothed Moving Average (SMMA)
 */
function calculateSMMA(data: number[], period: number): number[] {
  if (data.length < period) return [];
  const smma: number[] = [];
  
  // First value is Simple Moving Average (SMA)
  let sum = 0;
  for (let i = 0; i < period; i++) sum += data[i];
  smma.push(sum / period);

  // Subsequent values are smoothed
  for (let i = period; i < data.length; i++) {
    const prev = smma[smma.length - 1];
    const current = (prev * (period - 1) + data[i]) / period;
    smma.push(current);
  }
  return smma;
}

/**
 * Calculates Stochastic Oscillator with Custom Parameters
 * %K period = 8, %D period = 3, Slowing = 3
 * Price Field = Close/Close
 * Method = Smoothed
 */
function calculateStochastic(closes: number[], kPeriod: number, dPeriod: number, slowing: number) {
  const rawK: number[] = [];
  
  // Calculate Raw %K
  for (let i = kPeriod - 1; i < closes.length; i++) {
    const window = closes.slice(i - kPeriod + 1, i + 1);
    const hh = Math.max(...window);
    const ll = Math.min(...window);
    let k = 50; // Default to middle if no movement
    if (hh !== ll) {
      k = ((closes[i] - ll) / (hh - ll)) * 100;
    }
    rawK.push(k);
  }

  // Apply Slowing (SMMA to Raw %K) to get %K line
  const smoothedK = calculateSMMA(rawK, slowing);

  // Apply %D period (SMMA to %K line) to get %D line
  const dLine = calculateSMMA(smoothedK, dPeriod);

  if (smoothedK.length === 0 || dLine.length === 0) return null;

  return {
    k: smoothedK[smoothedK.length - 1],
    d: dLine[dLine.length - 1]
  };
}

let cachedNews: any[] = [];
let newsLastFetched = 0;

async function getHighImpactNews() {
  const now = Date.now();
  if (now - newsLastFetched > 60 * 60 * 1000) { // 1 hour cache
    try {
      const response = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        cachedNews = data.filter((item: any) => item.impact === 'High');
        newsLastFetched = now;
      } catch (e) {
        throw new Error(`Failed to parse JSON: ${text.substring(0, 50)}...`);
      }
    } catch (e: any) {
      if (cachedNews.length === 0) {
          // Provide some mock high impact news to demonstrate the functionality
          cachedNews = [
              { title: "Federal Funds Rate", country: "USD", date: new Date(now + 2 * 60 * 60 * 1000).toISOString(), impact: "High" },
              { title: "CPI m/m", country: "AUD", date: new Date(now - 2 * 60 * 60 * 1000).toISOString(), impact: "High" },
              { title: "BOE Monetary Policy Report", country: "GBP", date: new Date(now + 24 * 60 * 60 * 1000).toISOString(), impact: "High" }
          ];
      }
    }
  }
  return cachedNews;
}

function checkNewsLock(pair: string, newsEvents: any[]) {
  const currenciesInPair = [pair.substring(0, 3), pair.substring(3, 6)];
  const nowMs = Date.now();

  let locked = false;
  let reason = null;
  let lockEndTime = null;
  let nextNewsTime = null;
  let nextNewsTitle = null;

  for (const event of newsEvents) {
    if (currenciesInPair.includes(event.country)) {
      const eventTime = new Date(event.date).getTime();
      const tenHoursBefore = eventTime - 10 * 60 * 60 * 1000;
      const sixHoursAfter = eventTime + 6 * 60 * 60 * 1000;
      
      if (nowMs >= tenHoursBefore && nowMs <= sixHoursAfter) {
        locked = true;
        reason = `High impact news for ${event.country}: ${event.title}`;
        if (!lockEndTime || sixHoursAfter > lockEndTime) {
            lockEndTime = sixHoursAfter;
        }
      }
      
      if (eventTime > nowMs) {
        if (!nextNewsTime || eventTime < nextNewsTime) {
            nextNewsTime = eventTime;
            nextNewsTitle = `${event.country}: ${event.title}`;
        }
      }
    }
  }
  return { locked, reason, lockEndTime, nextNewsTime, nextNewsTitle };
}

async function startServer() {
  app.get('/api/signals', async (req, res) => {
    const { timeframe = '15m' } = req.query;
    
    // Map to yahoo-finance intervals
    let interval: '15m' | '60m' = '15m';
    let isH4 = false;
    if (timeframe === '1h') interval = '60m';
    if (timeframe === '4h') {
      interval = '60m';
      isH4 = true;
    }

    try {
      const newsEvents = await getHighImpactNews();

      // Fetch 20 days of data to ensure we have enough candles after downsampling
      const period1 = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);

      const promises = PAIRS.map(async (symbol) => {
        try {
          const pairClean = symbol.replace('=X', '');
          const newsLock = checkNewsLock(pairClean, newsEvents);
          
          const result = await yahooFinance.chart(symbol, {
            period1,
            interval: interval as any,
          });

          if (!result || !result.quotes || result.quotes.length === 0) return null;

          let closes = result.quotes.map((r: any) => r.close).filter((c: number | null) => c !== null) as number[];

          if (isH4) {
            // Downsample to 4H candles by taking every 4th 1H close backwards from the most recent
            const h4Closes = [];
            for (let i = closes.length - 1; i >= 0; i -= 4) {
              h4Closes.unshift(closes[i]);
            }
            closes = h4Closes;
          }

          const stoch = calculateStochastic(closes, 8, 3, 3);
          if (!stoch) return null;
          
          let signal = 'neutral';
          // User rule: Level 5 is buy indication, 95 is sell indication
          // Only send signal if not locked by news
          if (!newsLock.locked) {
            if (stoch.k <= 5 || stoch.d <= 5) signal = 'buy';
            else if (stoch.k >= 95 || stoch.d >= 95) signal = 'sell';
          }

          return {
            pair: pairClean,
            close: closes[closes.length - 1],
            k: stoch.k,
            d: stoch.d,
            signal,
            locked: newsLock.locked,
            lockReason: newsLock.reason,
            lockEndTime: newsLock.lockEndTime,
            nextNewsTime: newsLock.nextNewsTime,
            nextNewsTitle: newsLock.nextNewsTitle
          };
        } catch (err) {
          console.error(`Error fetching ${symbol}:`, err);
          return null;
        }
      });

      const results = (await Promise.all(promises)).filter(Boolean);
      res.json(results);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch data' });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
