import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, combineLatest, map, of, throwError } from 'rxjs';
import { MoneyRequest, Portfolio, Holding, Order, TradeRequest, Transaction } from '../models/portfolio.model';
import { Stock } from '../models/stock.model';
import { StockService } from './stock.service';

const STORAGE_KEY = 'dragonfi:portfolio:v1';
const STARTING_CASH = 25000;

interface PersistedHolding {
  symbol: string;
  quantity: number;
  totalCost: number; // running sum of cost basis
}

interface PersistedState {
  cashBalance: number;
  holdings: PersistedHolding[];
  orders: Order[];
  transactions: Transaction[];
}

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private state$ = new BehaviorSubject<PersistedState>(this.empty());
  private tradeExecuted$ = new Subject<void>();

  constructor(private stockService: StockService) {
    this.state$.next(this.loadOrSeed());
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Public API (compatible with previous HTTP-based service)
  // ─────────────────────────────────────────────────────────────────────────

  getPortfolio(): Observable<Portfolio> {
    return of(this.compute(this.state$.value, this.stockService.snapshot));
  }

  getLivePortfolio(): Observable<Portfolio> {
    return combineLatest([this.state$, this.stockService.live$]).pipe(
      map(([state, stocks]) => this.compute(state, stocks))
    );
  }

  executeTrade(request: TradeRequest): Observable<Order> {
    const stock = this.stockService.snapshot.find(s => s.symbol === request.symbol);
    if (!stock) return throwError(() => ({ error: { message: `Unknown symbol ${request.symbol}` } }));
    if (request.quantity <= 0) return throwError(() => ({ error: { message: 'Quantity must be positive' } }));

    const state = { ...this.state$.value };
    const price = stock.price;
    const total = round(price * request.quantity);

    if (request.type === 'BUY') {
      if (state.cashBalance < total) {
        return throwError(() => ({ error: { message: `Insufficient cash. Need ${fmt(total)}, have ${fmt(state.cashBalance)}.` } }));
      }
      state.cashBalance = round(state.cashBalance - total);
      const existing = state.holdings.find(h => h.symbol === stock.symbol);
      if (existing) {
        existing.quantity += request.quantity;
        existing.totalCost = round(existing.totalCost + total);
      } else {
        state.holdings = [...state.holdings, { symbol: stock.symbol, quantity: request.quantity, totalCost: total }];
      }
    } else {
      const existing = state.holdings.find(h => h.symbol === stock.symbol);
      if (!existing || existing.quantity < request.quantity) {
        return throwError(() => ({ error: { message: `Insufficient shares of ${stock.symbol}.` } }));
      }
      const costBasisPerShare = existing.totalCost / existing.quantity;
      existing.quantity -= request.quantity;
      existing.totalCost = round(existing.totalCost - costBasisPerShare * request.quantity);
      if (existing.quantity === 0) {
        state.holdings = state.holdings.filter(h => h.symbol !== stock.symbol);
      }
      state.cashBalance = round(state.cashBalance + total);
    }

    const order: Order = {
      id: makeId('ord'),
      symbol: stock.symbol,
      name: stock.name,
      type: request.type,
      quantity: request.quantity,
      price,
      total,
      executedAt: new Date().toISOString(),
      status: 'EXECUTED',
    };
    state.orders = [order, ...state.orders];

    this.commit(state);
    this.tradeExecuted$.next();
    return of(order);
  }

  getOrders(): Observable<Order[]> {
    return of(this.state$.value.orders);
  }

  getTransactions(): Observable<Transaction[]> {
    return of(this.state$.value.transactions);
  }

  deposit(amount: number): Observable<Transaction> {
    if (amount <= 0) return throwError(() => ({ error: { message: 'Amount must be positive' } }));
    const state = { ...this.state$.value };
    state.cashBalance = round(state.cashBalance + amount);
    const tx: Transaction = {
      id: makeId('tx'),
      type: 'DEPOSIT',
      amount: round(amount),
      balanceAfter: state.cashBalance,
      note: 'Deposit',
      createdAt: new Date().toISOString(),
      status: 'COMPLETED',
    };
    state.transactions = [tx, ...state.transactions];
    this.commit(state);
    return of(tx);
  }

  withdraw(amount: number): Observable<Transaction> {
    if (amount <= 0) return throwError(() => ({ error: { message: 'Amount must be positive' } }));
    const state = { ...this.state$.value };
    if (state.cashBalance < amount) {
      return throwError(() => ({ error: { message: `Insufficient cash. Available ${fmt(state.cashBalance)}.` } }));
    }
    state.cashBalance = round(state.cashBalance - amount);
    const tx: Transaction = {
      id: makeId('tx'),
      type: 'WITHDRAWAL',
      amount: round(amount),
      balanceAfter: state.cashBalance,
      note: 'Withdrawal',
      createdAt: new Date().toISOString(),
      status: 'COMPLETED',
    };
    state.transactions = [tx, ...state.transactions];
    this.commit(state);
    return of(tx);
  }

  notifyTradeExecuted() {
    this.tradeExecuted$.next();
  }

  get tradeExecuted(): Observable<void> {
    return this.tradeExecuted$.asObservable();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Internals
  // ─────────────────────────────────────────────────────────────────────────

  private compute(state: PersistedState, stocks: Stock[]): Portfolio {
    const priceMap = new Map(stocks.map(s => [s.symbol, s]));
    const holdings: Holding[] = state.holdings.map(h => {
      const s = priceMap.get(h.symbol);
      const currentPrice = s?.price ?? 0;
      const averageCost = h.quantity ? h.totalCost / h.quantity : 0;
      const currentValue = round(currentPrice * h.quantity);
      const gainLoss = round(currentValue - h.totalCost);
      const gainLossPercent = h.totalCost ? round((gainLoss / h.totalCost) * 100, 2) : 0;
      return {
        symbol: h.symbol,
        name: s?.name ?? h.symbol,
        quantity: h.quantity,
        averageCost: round(averageCost),
        currentPrice,
        totalCost: round(h.totalCost),
        currentValue,
        gainLoss,
        gainLossPercent,
      };
    });

    const totalInvested = round(holdings.reduce((sum, h) => sum + h.totalCost, 0));
    const totalMarketValue = round(holdings.reduce((sum, h) => sum + h.currentValue, 0));
    const totalValue = round(state.cashBalance + totalMarketValue);
    const totalGainLoss = round(totalMarketValue - totalInvested);
    const totalGainLossPercent = totalInvested ? round((totalGainLoss / totalInvested) * 100, 2) : 0;

    return {
      cashBalance: round(state.cashBalance),
      holdings,
      totalInvested,
      totalValue,
      totalGainLoss,
      totalGainLossPercent,
    };
  }

  private commit(state: PersistedState) {
    this.persist(state);
    this.state$.next(state);
  }

  private persist(state: PersistedState) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

  private loadOrSeed(): PersistedState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedState;
        if (parsed && typeof parsed.cashBalance === 'number') return parsed;
      }
    } catch {}
    const fresh = this.seed();
    this.persist(fresh);
    return fresh;
  }

  private empty(): PersistedState {
    return { cashBalance: STARTING_CASH, holdings: [], orders: [], transactions: [] };
  }

  private seed(): PersistedState {
    const now = new Date();
    const stocks = this.stockService.snapshot;
    const findPrice = (sym: string) => stocks.find(s => s.symbol === sym)?.price ?? 100;

    // Starter holdings — bought "yesterday" at slightly off prices so there's
    // some P&L for the user to see on first load.
    const seedTrades: Array<{ symbol: string; qty: number; pricePct: number }> = [
      { symbol: 'AAPL', qty: 12, pricePct: 0.97 },
      { symbol: 'MSFT', qty: 5,  pricePct: 1.02 },
      { symbol: 'NVDA', qty: 18, pricePct: 0.92 },
      { symbol: 'TSLA', qty: 4,  pricePct: 1.06 },
    ];

    let cash = STARTING_CASH + 25000; // start with more so we can buy and still have cash
    const holdings: PersistedHolding[] = [];
    const orders: Order[] = [];
    const transactions: Transaction[] = [];

    // initial deposit
    const seedDeposit: Transaction = {
      id: makeId('tx'),
      type: 'DEPOSIT',
      amount: cash,
      balanceAfter: cash,
      note: 'Initial funding',
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'COMPLETED',
    };
    transactions.push(seedDeposit);

    seedTrades.forEach((t, i) => {
      const stock = stocks.find(s => s.symbol === t.symbol);
      if (!stock) return;
      const buyPrice = round(findPrice(t.symbol) * t.pricePct);
      const total = round(buyPrice * t.qty);
      if (cash < total) return;
      cash = round(cash - total);
      holdings.push({ symbol: t.symbol, quantity: t.qty, totalCost: total });
      orders.push({
        id: makeId('ord'),
        symbol: t.symbol,
        name: stock.name,
        type: 'BUY',
        quantity: t.qty,
        price: buyPrice,
        total,
        executedAt: new Date(now.getTime() - (2 - i * 0.1) * 24 * 60 * 60 * 1000).toISOString(),
        status: 'EXECUTED',
      });
    });

    return {
      cashBalance: cash,
      holdings,
      orders,
      transactions,
    };
  }
}

let _idCounter = 0;
function makeId(prefix: string): string {
  _idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${_idCounter.toString(36)}`;
}

function round(n: number, p = 2): number {
  const f = Math.pow(10, p);
  return Math.round(n * f) / f;
}

function fmt(n: number): string {
  return `$${n.toFixed(2)}`;
}
