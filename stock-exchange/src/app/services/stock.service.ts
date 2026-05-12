import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, interval, switchMap, startWith, shareReplay, BehaviorSubject } from 'rxjs';
import { Stock, StockCandle, MarketSummary, SectorSummary } from '../models/stock.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StockService {
  private apiUrl = `${environment.apiUrl}/api/stocks`;
  private refreshInterval = 3000;

  constructor(private http: HttpClient) {}

  getAllStocks(sector?: string, search?: string): Observable<Stock[]> {
    let params = new HttpParams();
    if (sector) params = params.set('sector', sector);
    if (search) params = params.set('search', search);
    return this.http.get<Stock[]>(this.apiUrl, { params });
  }

  getLiveStocks(): Observable<Stock[]> {
    return interval(this.refreshInterval).pipe(
      startWith(0),
      switchMap(() => this.getAllStocks()),
      shareReplay(1)
    );
  }

  getStock(symbol: string): Observable<Stock> {
    return this.http.get<Stock>(`${this.apiUrl}/${symbol}`);
  }

  getLiveStock(symbol: string): Observable<Stock> {
    return interval(this.refreshInterval).pipe(
      startWith(0),
      switchMap(() => this.getStock(symbol)),
      shareReplay(1)
    );
  }

  getCandles(symbol: string, period: string = '1M'): Observable<StockCandle[]> {
    return this.http.get<StockCandle[]>(`${this.apiUrl}/${symbol}/candles`, {
      params: new HttpParams().set('period', period)
    });
  }

  getMarketSummary(): Observable<MarketSummary> {
    return this.http.get<MarketSummary>(`${this.apiUrl}/market/summary`);
  }

  getLiveMarketSummary(): Observable<MarketSummary> {
    return interval(this.refreshInterval).pipe(
      startWith(0),
      switchMap(() => this.getMarketSummary()),
      shareReplay(1)
    );
  }

  getSectors(): Observable<SectorSummary[]> {
    return this.http.get<SectorSummary[]>(`${this.apiUrl}/sectors`);
  }
}
