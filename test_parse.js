import { XMLParser } from 'fast-xml-parser';

async function test() {
  const res = await fetch('https://www.myfxbook.com/rss/forex-economic-calendar-events');
  const text = await res.text();
  const parser = new XMLParser();
  const parsed = parser.parse(text);
  const items = parsed.rss.channel.item;
  
  const high = items.filter(item => item.description.includes('sprite-high-impact'));
  
  high.forEach(item => {
    let desc = item.description.replace(/&#60;/g, '<').replace(/&#62;/g, '>').replace(/&#39;/g, "'").replace(/&#34;/g, '"');
    
    // Use regex to get the tds
    const tdRegex = /<td[^>]*>(.*?)<\/td>/gs;
    const tds = [...desc.matchAll(tdRegex)].map(m => m[1].trim());
    
    if (tds.length >= 5) {
      const prev = tds[2].replace(/<\/?[^>]+(>|$)/g, "").trim();
      const cons = tds[3].replace(/<\/?[^>]+(>|$)/g, "").trim();
      const act = tds[4].replace(/<\/?[^>]+(>|$)/g, "").trim();
      
      console.log(item.title, "| Prev:", prev, "| Cons:", cons, "| Act:", act, "| Date:", item.pubDate);
    }
  });
}
test();
