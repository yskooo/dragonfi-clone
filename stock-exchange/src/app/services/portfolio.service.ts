import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, startWith, shareReplay, Subject } from 'rxjs';
import { MoneyRequest, Portfolio, Order, TradeRequest, Transaction } from '../models/portfolio.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private apiUrl = `${environment.apiUrl}/api/portfolio`;
  private tradeExecuted$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  getPortfolio(): Observable<Portfolio> {
    return this.http.get<Portfolio>(this.apiUrl);
  }

  getLivePortfolio(): Observable<Portfolio> {
    return interval(3000).pipe(
      startWith(0),
      switchMap(() => this.getPortfolio()),
      shareReplay(1)
    );
  }

  executeTrade(request: TradeRequest): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/trade`, request);
  }

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders`);
  }

  getTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/transactions`);
  }

  deposit(amount: number): Observable<Transaction> {
    const request: MoneyRequest = { amount };
    return this.http.post<Transaction>(`${this.apiUrl}/deposit`, request);
  }

  withdraw(amount: number): Observable<Transaction> {
    const request: MoneyRequest = { amount };
    return this.http.post<Transaction>(`${this.apiUrl}/withdraw`, request);
  }

  notifyTradeExecuted() {
    this.tradeExecuted$.next();
  }

  get tradeExecuted(): Observable<void> {
    return this.tradeExecuted$.asObservable();
  }
}
