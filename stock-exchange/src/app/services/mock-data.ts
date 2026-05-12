import { Stock, StockCandle } from '../models/stock.model';

interface SeedStock {
  symbol: string;
  name: string;
  sector: string;
  basePrice: number;
  sharesOutstanding: number;
  peRatio: number;
  dividendYield: number;
}

const SEED: SeedStock[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', basePrice: 178.32, sharesOutstanding: 15_500_000_000, peRatio: 29.4, dividendYield: 0.54 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', basePrice: 412.65, sharesOutstanding: 7_430_000_000, peRatio: 35.1, dividendYield: 0.72 },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology', basePrice: 138.07, sharesOutstanding: 24_600_000_000, peRatio: 65.2, dividendYield: 0.03 },
  { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', sector: 'Communication Services', basePrice: 172.41, sharesOutstanding: 12_300_000_000, peRatio: 26.7, dividendYield: 0.45 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary', basePrice: 197.83, sharesOutstanding: 10_500_000_000, peRatio: 47.9, dividendYield: 0 },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Communication Services', basePrice: 562.18, sharesOutstanding: 2_540_000_000, peRatio: 27.3, dividendYield: 0.36 },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Discretionary', basePrice: 241.94, sharesOutstanding: 3_180_000_000, peRatio: 71.8, dividendYield: 0 },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc. Class B', sector: 'Financials', basePrice: 458.21, sharesOutstanding: 2_170_000_000, peRatio: 9.5, dividendYield: 0 },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financials', basePrice: 228.74, sharesOutstanding: 2_840_000_000, peRatio: 12.8, dividendYield: 2.13 },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Financials', basePrice: 304.55, sharesOutstanding: 1_840_000_000, peRatio: 31.2, dividendYield: 0.78 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', basePrice: 158.42, sharesOutstanding: 2_400_000_000, peRatio: 23.9, dividendYield: 3.16 },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.', sector: 'Healthcare', basePrice: 592.16, sharesOutstanding: 920_000_000, peRatio: 24.7, dividendYield: 1.42 },
  { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare', basePrice: 27.83, sharesOutstanding: 5_660_000_000, peRatio: 19.4, dividendYield: 6.05 },
  { symbol: 'XOM', name: 'Exxon Mobil Corporation', sector: 'Energy', basePrice: 117.21, sharesOutstanding: 4_410_000_000, peRatio: 14.2, dividendYield: 3.27 },
  { symbol: 'CVX', name: 'Chevron Corporation', sector: 'Energy', basePrice: 161.45, sharesOutstanding: 1_840_000_000, peRatio: 16.3, dividendYield: 4.05 },
  { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer Staples', basePrice: 84.27, sharesOutstanding: 8_030_000_000, peRatio: 41.6, dividendYield: 0.98 },
  { symbol: 'KO', name: 'The Coca-Cola Company', sector: 'Consumer Staples', basePrice: 64.31, sharesOutstanding: 4_310_000_000, peRatio: 28.4, dividendYield: 3.01 },
  { symbol: 'PG', name: 'Procter & Gamble Co.', sector: 'Consumer Staples', basePrice: 169.04, sharesOutstanding: 2_360_000_000, peRatio: 27.8, dividendYield: 2.38 },
  { symbol: 'DIS', name: 'The Walt Disney Company', sector: 'Communication Services', basePrice: 113.82, sharesOutstanding: 1_820_000_000, peRatio: 42.1, dividendYield: 0.88 },
  { symbol: 'BA', name: 'The Boeing Company', sector: 'Industrials', basePrice: 178.55, sharesOutstanding: 614_000_000, peRatio: 0, dividendYield: 0 },
  { symbol: 'CAT', name: 'Caterpillar Inc.', sector: 'Industrials', basePrice: 391.27, sharesOutstanding: 489_000_000, peRatio: 16.9, dividendYield: 1.49 },
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Communication Services', basePrice: 815.32, sharesOutstanding: 432_000_000, peRatio: 49.7, dividendYield: 0 },
];

const round = (n: number) => Math.round(n * 100) / 100;

export const STOCK_SYMBOLS: string[] = SEED.map(s => s.symbol);

export function buildSeedStocks(): Stock[] {
  return SEED.map(s => {
    const opening = s.basePrice * (1 + (Math.random() - 0.5) * 0.008);
    const change = (Math.random() - 0.48) * s.basePrice * 0.035;
    const price = Math.max(0.01, s.basePrice + change);
    const high = Math.max(opening, price) * (1 + Math.random() * 0.012);
    const low = Math.min(opening, price) * (1 - Math.random() * 0.012);
    return {
      symbol: s.symbol,
      name: s.name,
      sector: s.sector,
      price: round(price),
      change: round(change),
      changePercent: round((change / s.basePrice) * 100),
      open: round(opening),
      high: round(high),
      low: round(low),
      previousClose: round(s.basePrice),
      volume: Math.floor(Math.random() * 80_000_000) + 2_000_000,
      marketCap: Math.floor(price * s.sharesOutstanding),
      peRatio: s.peRatio,
      dividendYield: s.dividendYield,
      weekHigh52: round(s.basePrice * (1.18 + Math.random() * 0.12)),
      weekLow52: round(s.basePrice * (0.62 + Math.random() * 0.12)),
    };
  });
}

export function tickStocks(stocks: Stock[]): Stock[] {
  return stocks.map(s => {
    // small random walk, slight mean-reverting pull toward previousClose
    const drift = (s.previousClose - s.price) * 0.02;
    const noise = (Math.random() - 0.5) * s.price * 0.006;
    const newPrice = Math.max(0.01, s.price + drift + noise);
    const change = newPrice - s.previousClose;
    return {
      ...s,
      price: round(newPrice),
      change: round(change),
      changePercent: round((change / s.previousClose) * 100),
      high: round(Math.max(s.high, newPrice)),
      low: round(Math.min(s.low, newPrice)),
      volume: s.volume + Math.floor(Math.random() * 80_000),
    };
  });
}

export function generateCandles(stock: Stock, period: string): StockCandle[] {
  const periodDays: Record<string, number> = {
    '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365
  };
  const days = periodDays[period] ?? 30;

  const candles: StockCandle[] = [];
  // walk backward from current price, then we'll reverse
  let price = stock.price;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // seed RNG-ish but deterministic per symbol so chart doesn't change on every poll
  let seed = stock.symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const dayClose = price;
    const dailyMove = (rand() - 0.5) * price * 0.022;
    const dayOpen = Math.max(0.01, price - dailyMove);
    const dayHigh = Math.max(dayOpen, dayClose) * (1 + rand() * 0.012);
    const dayLow = Math.min(dayOpen, dayClose) * (1 - rand() * 0.012);
    candles.push({
      date: date.toISOString().split('T')[0],
      open: round(dayOpen),
      high: round(dayHigh),
      low: round(dayLow),
      close: round(dayClose),
      volume: Math.floor(rand() * 40_000_000) + 1_000_000,
    });
    price = dayOpen;
  }
  return candles.reverse();
}
