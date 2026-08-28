const title = "United States Jackson Hole Symposium";
const countryMap = {
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
let currency = 'USD'; // default
for (const [country, cur] of Object.entries(countryMap)) {
  if (title.startsWith(country)) {
    currency = cur;
    break;
  }
}
console.log(currency);
