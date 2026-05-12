export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  marketCap: number;
  peRatio: number;
  dividendYield: number;
  weekHigh52: number;
  weekLow52: number;
}

export interface StockCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
}

export interface MarketSummary {
  totalStocks: number;
  advancing: number;
  declining: number;
  unchanged: number;
  topGainers: Stock[];
  topLosers: Stock[];
  mostActive: Stock[];
  indices: MarketIndex[];
}

export interface SectorSummary {
  sector: string;
  count: number;
  averageChange: number;
  totalMarketCap: number;
}
