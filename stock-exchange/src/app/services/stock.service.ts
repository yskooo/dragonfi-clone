import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of } from 'rxjs';
import { Stock, StockCandle, MarketSummary, SectorSummary } from '../models/stock.model';
import { buildSeedStocks, tickStocks, generateCandles } from './mock-data';

const STORAGE_KEY = 'dragonfi:stocks:v1';
const TICK_MS = 3000;

@Injectable({ providedIn: 'root' })
export class StockService {
  private stocks$ = new BehaviorSubject<Stock[]>([]);

  constructor() {
    this.stocks$.next(this.loadOrSeed());
    setInterval(() => this.tick(), TICK_MS);
  }

  private loadOrSeed(): Stock[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Stock[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    const fresh = buildSeedStocks();
    this.persist(fresh);
    return fresh;
  }

  private persist(stocks: Stock[]) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stocks)); } catch {}
  }

  private tick() {
    const next = tickStocks(this.stocks$.value);
    this.persist(next);
    this.stocks$.next(next);
  }

  /** Snapshot of current stock prices — used by PortfolioService. */
  get snapshot(): Stock[] { return this.stocks$.value; }
  get live$(): Observable<Stock[]> { return this.stocks$.asObservable(); }

  getAllStocks(sector?: string, search?: string): Observable<Stock[]> {
    return of(this.applyFilters(this.stocks$.value, sector, search));
  }

  getLiveStocks(): Observable<Stock[]> {
    return this.stocks$.asObservable();
  }

  getStock(symbol: string): Observable<Stock> {
    const s = this.stocks$.value.find(x => x.symbol === symbol);
    return s ? of(s) : of({} as Stock);
  }

  getLiveStock(symbol: string): Observable<Stock> {
    return this.stocks$.pipe(map(list => list.find(s => s.symbol === symbol) ?? ({} as Stock)));
  }

  getCandles(symbol: string, period: string = '1M'): Observable<StockCandle[]> {
    const s = this.stocks$.value.find(x => x.symbol === symbol);
    if (!s) return of([]);
    return of(generateCandles(s, period));
  }

  getMarketSummary(): Observable<MarketSummary> {
    return of(this.buildSummary(this.stocks$.value));
  }

  getLiveMarketSummary(): Observable<MarketSummary> {
    return this.stocks$.pipe(map(list => this.buildSummary(list)));
  }

  getSectors(): Observable<SectorSummary[]> {
    return of(this.buildSectors(this.stocks$.value));
  }

  private applyFilters(stocks: Stock[], sector?: string, search?: string): Stock[] {
    let result = stocks;
    if (sector) result = result.filter(s => s.sector === sector);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    }
    return result;
  }

  private buildSummary(stocks: Stock[]): MarketSummary {
    const advancing = stocks.filter(s => s.change > 0).length;
    const declining = stocks.filter(s => s.change < 0).length;
    const unchanged = stocks.length - advancing - declining;
    const sorted = [...stocks];
    const topGainers = [...sorted].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
    const topLosers = [...sorted].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);
    const mostActive = [...sorted].sort((a, b) => b.volume - a.volume).slice(0, 5);

    // simple synthetic indices based on weighted averages
    const techAvg = avg(stocks.filter(s => s.sector === 'Technology').map(s => s.changePercent));
    const allAvg = avg(stocks.map(s => s.changePercent));
    const finAvg = avg(stocks.filter(s => s.sector === 'Financials').map(s => s.changePercent));
    const indices = [
      { name: 'DRG 500', value: round(4850 * (1 + allAvg / 100)), change: round(allAvg, 2) },
      { name: 'DRG Tech 100', value: round(18420 * (1 + techAvg / 100)), change: round(techAvg, 2) },
      { name: 'DRG Financials', value: round(2310 * (1 + finAvg / 100)), change: round(finAvg, 2) },
    ];

    return {
      totalStocks: stocks.length,
      advancing,
      declining,
      unchanged,
      topGainers,
      topLosers,
      mostActive,
      indices,
    };
  }

  private buildSectors(stocks: Stock[]): SectorSummary[] {
    const groups = new Map<string, Stock[]>();
    for (const s of stocks) {
      if (!groups.has(s.sector)) groups.set(s.sector, []);
      groups.get(s.sector)!.push(s);
    }
    return Array.from(groups.entries()).map(([sector, list]) => ({
      sector,
      count: list.length,
      averageChange: round(avg(list.map(s => s.changePercent)), 2),
      totalMarketCap: list.reduce((a, b) => a + b.marketCap, 0),
    }));
  }
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function round(n: number, p = 2): number {
  const f = Math.pow(10, p);
  return Math.round(n * f) / f;
}
