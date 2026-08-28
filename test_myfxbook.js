import { XMLParser } from 'fast-xml-parser';

async function test() {
  const res = await fetch('https://www.myfxbook.com/rss/forex-economic-calendar-events');
  const text = await res.text();
  const parser = new XMLParser();
  const parsed = parser.parse(text);
  const items = parsed.rss.channel.item;
  
  console.log("Total events:", items.length);
  const first = items[0];
  console.log("First:", first.title, first.pubDate);
  const last = items[items.length - 1];
  console.log("Last:", last.title, last.pubDate);
}

test();
