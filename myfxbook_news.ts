import { XMLParser } from 'fast-xml-parser';

const countryCurrencyMap: Record<string, string> = {
  'United States': 'USD',
  'Canada': 'CAD',
  'Euro Area': 'EUR',
  'Germany': 'EUR',
  'France': 'EUR',
  'Spain': 'EUR',
  'Italy': 'EUR',
  'United Kingdom': 'GBP',
  'Japan': 'JPY',
  'Australia': 'AUD',
  'New Zealand': 'NZD',
  'Switzerland': 'CHF',
  'China': 'CNY',
};

export async function fetchMyFxBookNews() {
  try {
    const res = await fetch('https://www.myfxbook.com/rss/forex-economic-calendar-events', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const text = await res.text();
    const parser = new XMLParser();
    const parsed = parser.parse(text);
    const items = parsed?.rss?.channel?.item;
    
    if (!items || !Array.isArray(items)) return [];
    
    const formattedNews = items.map((item: any) => {
      let desc = item.description.replace(/&#60;/g, '<').replace(/&#62;/g, '>').replace(/&#39;/g, "'").replace(/&#34;/g, '"');
      const tdRegex = /<td[^>]*>(.*?)<\/td>/gs;
      const tds = [...desc.matchAll(tdRegex)].map(m => m[1].trim());
      
      let impact = "Low";
      if (desc.includes('sprite-high-impact')) impact = "High";
      else if (desc.includes('sprite-medium-impact')) impact = "Medium";
      
      let previous = "", forecast = "", actual = "";
      if (tds.length >= 5) {
        previous = tds[2].replace(/<\/?[^>]+(>|$)/g, "").trim();
        forecast = tds[3].replace(/<\/?[^>]+(>|$)/g, "").trim();
        actual = tds[4].replace(/<\/?[^>]+(>|$)/g, "").trim();
      }
      
      let country = 'USD'; // default
      for (const [cName, curr] of Object.entries(countryCurrencyMap)) {
        if (item.title.startsWith(cName)) {
          country = curr;
          break;
        }
      }
      
      return {
        title: item.title,
        country,
        date: new Date(item.pubDate).toISOString(),
        impact,
        forecast,
        previous,
        actual: actual === "" ? undefined : actual
      };
    });
    
    return formattedNews.filter(n => n.impact === 'High');
  } catch (e) {
    console.error("MyFxBook error:", e);
    return [];
  }
}
