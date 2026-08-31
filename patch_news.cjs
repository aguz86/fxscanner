const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `async function getHighImpactNews() {
  const now = Date.now();
  if (now - newsLastFetched > 5 * 60 * 1000) { // 5 minutes cache
    newsLastFetched = now;
    try {
      const response = await fetch('https://www.myfxbook.com/rss/forex-economic-calendar-events', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }
      const text = await response.text();
      const parser = new XMLParser();
      const parsed = parser.parse(text);
      const items = parsed?.rss?.channel?.item;
      
      if (items && Array.isArray(items)) {
        const formattedNews = items.map((item: any) => {
          let desc = item.description.replace(/&#60;/g, '<').replace(/&#62;/g, '>').replace(/&#39;/g, "'").replace(/&#34;/g, '"');
          const tdRegex = /<td[^>]*>(.*?)<\\/td>/gs;
          const tds = [...desc.matchAll(tdRegex)].map(m => m[1].trim());
          
          let impact = "Low";
          if (desc.includes('sprite-high-impact')) impact = "High";
          else if (desc.includes('sprite-medium-impact')) impact = "Medium";
          
          let previous = "", forecast = "", actual = "";
          if (tds.length >= 5) {
            previous = tds[2].replace(/<\\/?[^>]+(>|$)/g, "").trim();
            forecast = tds[3].replace(/<\\/?[^>]+(>|$)/g, "").trim();
            actual = tds[4].replace(/<\\/?[^>]+(>|$)/g, "").trim();
          }
          
          let country: string | null = null;
          for (const [cName, curr] of Object.entries(countryCurrencyMap)) {
            if (item.title.startsWith(cName)) {
              country = curr;
              break;
            }
          }
          
          if (!country) {
            const possibleCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF', 'CNY'];
            for (const curr of possibleCurrencies) {
              if (item.title.includes(curr)) {
                country = curr;
                break;
              }
            }
          }
          
          return {
            title: item.title,
            country: country || 'Unknown',
            date: new Date(item.pubDate),
            impact: impact,
            previous: previous === "" ? undefined : previous,
            forecast: forecast === "" ? undefined : forecast,
            actual: actual === "" ? undefined : actual
          };
        });
        
        cachedNews = formattedNews.sort((a, b) => a.date.getTime() - b.date.getTime());
      }
    } catch (e: any) {
      console.error('Failed to fetch or parse news from MyFxBook:', e.message);
      // Return existing cached news if available, otherwise return empty array
      if (!cachedNews) {
        cachedNews = [];
      }
    }
  }
  return cachedNews;
}`;

const replacement = `async function getHighImpactNews() {
  const now = Date.now();
  if (now - newsLastFetched > 5 * 60 * 1000) { // 5 minutes cache
    newsLastFetched = now;
    try {
      const response = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }
      
      const items = await response.json();
      if (items && Array.isArray(items)) {
        const formattedNews = items.map((item: any) => {
          let impact = "Low";
          if (item.impact === 'High') impact = "High";
          else if (item.impact === 'Medium') impact = "Medium";
          
          return {
            title: item.title,
            country: item.country || 'Unknown',
            date: new Date(item.date),
            impact: impact,
            previous: item.previous || undefined,
            forecast: item.forecast || undefined,
            actual: undefined
          };
        });
        
        cachedNews = formattedNews.sort((a, b) => a.date.getTime() - b.date.getTime());
      }
    } catch (e: any) {
      console.error('Failed to fetch or parse news from ForexFactory:', e.message);
      if (!cachedNews) {
        cachedNews = [];
      }
    }
  }
  return cachedNews;
}`;

code = code.replace(targetStr, replacement);
fs.writeFileSync('server.ts', code);
console.log('Patched');
