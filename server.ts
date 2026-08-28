import express from 'express';
import path from 'path';
import cors from 'cors';
import yahooFinancePkg from 'yahoo-finance2';
import { createServer as createViteServer } from 'vite';

const YFClass = (yahooFinancePkg as any).default || yahooFinancePkg;
const yahooFinance = new YFClass();
const app = express();
const PORT = 3000;

app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.originalUrl}`);
  next();
});

app.use(cors());

// List of target pairs
const PAIRS = [
  'EURUSD=X', 'AUDUSD=X', 'GBPUSD=X', 'NZDUSD=X',
  'EURCAD=X', 'AUDCAD=X', 'GBPCAD=X', 'USDCHF=X', 'GBPCHF=X',
  'EURJPY=X', 'AUDJPY=X',
  'NQ=F'
];

let pricesCache: { data: Record<string, number>, timestamp: number } | null = null;
const PRICE_CACHE_DURATION = 1000; // 1 second

app.get('/api/prices', async (req, res) => {
  if (pricesCache && Date.now() - pricesCache.timestamp < PRICE_CACHE_DURATION) {
    return res.json(pricesCache.data);
  }

  try {
    const quotes = await yahooFinance.quote(PAIRS);
    const prices: Record<string, number> = {};
    
    quotes.forEach((q: any) => {
      let cleanSymbol = q.symbol.replace('=X', '');
      if (q.symbol === 'NQ=F') cleanSymbol = 'NASDAQ';
      if (q.regularMarketPrice) {
        prices[cleanSymbol] = q.regularMarketPrice;
      }
    });

    pricesCache = { data: prices, timestamp: Date.now() };
    res.json(prices);
  } catch (error) {
    console.error('Failed to fetch prices:', error);
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
});

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

// Cache signals per timeframe
const signalCache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

async function getHighImpactNews() {
  const now = Date.now();
  if (now - newsLastFetched > 5 * 60 * 1000) { // 5 minutes cache
    newsLastFetched = now;
    try {
      const response = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        }
      });
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('429'); // Silent throw for rate limit
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        cachedNews = data.filter((item: any) => item.impact === 'High');
      } catch (e) {
        throw new Error(`Failed to parse JSON: ${text.substring(0, 50)}...`);
      }
    } catch (e: any) {
      if (e.message !== '429') {
        console.error('Failed to fetch or parse news from ForexFactory:', e.message);
      }
      // Return existing cached news if available, otherwise return empty array
      if (!cachedNews) {
        cachedNews = [];
      }
    }
  }
  return cachedNews;
}

function checkNewsLock(pair: string, newsEvents: any[]) {
  const isNasdaq = pair === 'NASDAQ';
  const currenciesInPair = isNasdaq ? ['USD'] : [pair.substring(0, 3), pair.substring(3, 6)];
  const nowMs = Date.now();

  let locked = false;
  let reason = null;
  let lockEndTime: number | null = null;
  let nextNewsTime: number | null = null;
  let nextNewsTitle: string | null = null;

  for (const event of newsEvents) {
    if (event.impact !== 'High') continue;

    const title = event.title.toLowerCase();
    
    let hoursBefore = 10;
    let hoursAfter = 6;
    let affectsPair = false;

    // TIER 1: 24 Jam sebelum, 8 Jam sesudah (Semua USD + NASDAQ)
    if (
      title.includes('fomc') || title.includes('federal funds rate') || 
      title.includes('nfp') || title.includes('non-farm') || title.includes('nonfarm') ||
      (title.includes('cpi') && event.country === 'USD') ||
      title.includes('core pce') ||
      title.includes('jackson hole') ||
      title.includes('warsh speaks') ||
      title.includes('payrolls revision')
    ) {
      if (currenciesInPair.includes('USD') || isNasdaq) {
        affectsPair = true;
        hoursBefore = 24;
        hoursAfter = 8;
      }
    }
    // TIER 3: 14 Jam sebelum, 4 Jam sesudah
    else if (
      title.includes('jobless claim') || 
      title.includes('retail sales') || 
      (title.includes('ppi') && event.country === 'USD')
    ) {
      if (currenciesInPair.includes('USD') || isNasdaq) {
        affectsPair = true;
        hoursBefore = 14;
        hoursAfter = 4;
      }
    } 
    else if (title.includes('jolt') || title.includes('ism pmi')) {
      if (['EURUSD', 'AUDUSD', 'GBPUSD', 'NASDAQ'].includes(pair)) {
        affectsPair = true;
        hoursBefore = 14;
        hoursAfter = 4;
      }
    }
    // TIER 2: 18 Jam sebelum, 6 Jam sesudah (Berita spesifik negara)
    else if (
      (title.includes('cpi') && ['AUD', 'GBP', 'EUR'].includes(event.country)) ||
      (title.includes('employment') && event.country === 'AUD') ||
      (title.includes('rate decision') && ['AUD', 'GBP', 'EUR'].includes(event.country)) ||
      title.includes('rba') || title.includes('boe') || title.includes('ecb') || title.includes('official bank rate') || title.includes('main refinancing rate')
    ) {
      if (currenciesInPair.includes(event.country)) {
        affectsPair = true;
        hoursBefore = 18;
        hoursAfter = 6;
      }
    }
    // Default fallback
    else {
      if (currenciesInPair.includes(event.country)) {
        affectsPair = true;
        hoursBefore = 10; // default
        hoursAfter = 6;
      }
    }

    if (affectsPair) {
      const eventTime = new Date(event.date).getTime();
      const lockStartTimeMs = eventTime - hoursBefore * 60 * 60 * 1000;
      const lockEndTimeMs = eventTime + hoursAfter * 60 * 60 * 1000;
      
      if (nowMs >= lockStartTimeMs && nowMs <= lockEndTimeMs) {
        locked = true;
        reason = `High impact news: ${event.title} (${event.country})`;
        if (!lockEndTime || lockEndTimeMs > lockEndTime) {
            lockEndTime = lockEndTimeMs;
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
  app.get('/api/news', async (req, res) => {
    try {
      const newsEvents = await getHighImpactNews();
      res.json(newsEvents);
    } catch (error: any) {
      console.error('Error fetching news:', error);
      res.status(500).json({ error: 'Failed to fetch news data' });
    }
  });

  app.get('/api/signals', async (req, res) => {
    const { timeframe = '15m' } = req.query;
    
    // Check cache
    const cacheKey = String(timeframe);
    if (signalCache[cacheKey] && (Date.now() - signalCache[cacheKey].timestamp < CACHE_DURATION)) {
      console.log(`[CACHE HIT] Returning cached signals for timeframe: ${timeframe}`);
      return res.json(signalCache[cacheKey].data);
    }
    
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
          let pairClean = symbol.replace('=X', '');
          if (symbol === 'NQ=F') pairClean = 'NASDAQ';
          
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
          
          let overbought = 95;
          let oversold = 5;
          if (timeframe === '1h') {
            overbought = 97;
            oversold = 3;
          } else if (timeframe === '4h') {
            overbought = 99;
            oversold = 1;
          }

          // Only send signal if not locked by news
          if (!newsLock.locked) {
            if (stoch.k <= oversold || stoch.d <= oversold) signal = 'buy';
            else if (stoch.k >= overbought || stoch.d >= overbought) signal = 'sell';
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
      
      // Update cache
      signalCache[cacheKey] = {
        data: results,
        timestamp: Date.now()
      };
      
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
