import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, switchMap } from 'rxjs';
import { StockService } from '../../services/stock.service';
import { PortfolioService } from '../../services/portfolio.service';
import { Stock, StockCandle } from '../../models/stock.model';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';

@Component({
  selector: 'app-stock-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, FormatNumberPipe],
  templateUrl: './stock-detail.component.html',
  styleUrl: './stock-detail.component.scss'
})
export class StockDetailComponent implements OnInit, OnDestroy {
  stock: Stock | null = null;
  candles: StockCandle[] = [];
  loading = true;
  selectedPeriod = '1M';
  periods = ['1W', '1M', '3M', '6M', '1Y'];

  tradeType: 'BUY' | 'SELL' = 'BUY';
  tradeQty = 1;
  tradeMessage = '';
  tradeSuccess = false;
  trading = false;

  private sub?: Subscription;
  private symbol = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private stockService: StockService,
    private portfolioService: PortfolioService
  ) {}

  ngOnInit() {
    this.sub = this.route.paramMap.pipe(
      switchMap(params => {
        this.symbol = params.get('symbol') || '';
        this.loading = true;
        this.loadCandles();
        return this.stockService.getLiveStock(this.symbol);
      })
    ).subscribe({
      next: data => { this.stock = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  loadCandles() {
    this.stockService.getCandles(this.symbol, this.selectedPeriod).subscribe(c => this.candles = c);
  }

  setPeriod(p: string) { this.selectedPeriod = p; this.loadCandles(); }

  get chartPath(): string {
    if (!this.candles.length) return '';
    const w = 800, h = 200, pad = 10;
    const prices = this.candles.map(c => c.close);
    const min = Math.min(...prices), max = Math.max(...prices);
    const range = max - min || 1;
    const points = prices.map((p, i) => {
      const x = pad + (i / (prices.length - 1)) * (w - pad * 2);
      const y = h - pad - ((p - min) / range) * (h - pad * 2);
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  }

  get chartFill(): string {
    if (!this.candles.length) return '';
    const path = this.chartPath;
    const lastPoint = path.split(' L ').pop()!;
    const [lx] = lastPoint.split(',');
    return `${path} L ${lx},210 L 10,210 Z`;
  }

  get isPositive(): boolean {
    return (this.stock?.change ?? 0) >= 0;
  }

  get totalCost(): number {
    return (this.stock?.price ?? 0) * this.tradeQty;
  }

  executeTrade() {
    if (!this.stock) return;
    this.trading = true;
    this.tradeMessage = '';
    this.portfolioService.executeTrade({
      symbol: this.stock.symbol,
      type: this.tradeType,
      quantity: this.tradeQty
    }).subscribe({
      next: () => {
        this.tradeSuccess = true;
        this.tradeMessage = `${this.tradeType} order for ${this.tradeQty} shares of ${this.stock!.symbol} executed.`;
        this.portfolioService.notifyTradeExecuted();
        this.trading = false;
        setTimeout(() => this.tradeMessage = '', 4000);
      },
      error: (err) => {
        this.tradeSuccess = false;
        this.tradeMessage = err.error?.message || 'Trade failed.';
        this.trading = false;
        setTimeout(() => this.tradeMessage = '', 4000);
      }
    });
  }
}
