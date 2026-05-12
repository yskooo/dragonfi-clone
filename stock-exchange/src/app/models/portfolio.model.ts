export interface Holding {
  symbol: string;
  name: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  totalCost: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

export interface Portfolio {
  cashBalance: number;
  holdings: Holding[];
  totalInvested: number;
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
}

export interface Order {
  id: string;
  symbol: string;
  name: string;
  type: string;
  quantity: number;
  price: number;
  total: number;
  executedAt: string;
  status: string;
}

export interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  amount: number;
  balanceAfter: number;
  note: string;
  createdAt: string;
  status: string;
}

export interface TradeRequest {
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
}

export interface MoneyRequest {
  amount: number;
}
