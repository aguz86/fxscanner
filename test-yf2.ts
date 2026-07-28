import yahooFinancePkg from 'yahoo-finance2';
const YFClass = (yahooFinancePkg as any).default || yahooFinancePkg;
const yahooFinance = new YFClass();
console.log(typeof yahooFinance.chart);
