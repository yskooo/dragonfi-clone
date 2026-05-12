import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, switchMap } from 'rxjs';
import { createChart, IChartApi, ISeriesApi, Time, CandlestickSeries } from 'lightweight-charts';
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
export class StockDetailComponent implements OnInit, OnDestroy, AfterViewInit {
  private _chartContainer?: ElementRef<HTMLDivElement>;
  
  @ViewChild('chartContainer') set chartContainer(content: ElementRef<HTMLDivElement>) {
    if (content && !this.chart) {
      this._chartContainer = content;
      // Initialize chart safely after view renders
      setTimeout(() => this.initChart(), 0);
    }
  }

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
  
  private chart: IChartApi | null = null;
  private candlestickSeries: ISeriesApi<"Candlestick"> | null = null;
  private resizeObserver: ResizeObserver | null = null;

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
  
  ngAfterViewInit() {
    // chart initialization is handled by the ViewChild setter
  }

  ngOnDestroy() { 
    this.sub?.unsubscribe();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.chart) {
      this.chart.remove();
    }
  }

  initChart() {
    if (!this._chartContainer?.nativeElement) return;
    
    this.chart = createChart(this._chartContainer.nativeElement, {
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f3fa' },
        horzLines: { color: '#f0f3fa' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1, // Normal
      }
    });

    this.candlestickSeries = this.chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444'
    });

    this.resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || entries[0].target !== this._chartContainer!.nativeElement) {
        return;
      }
      const newRect = entries[0].contentRect;
      this.chart?.applyOptions({ width: newRect.width, height: newRect.height });
    });

    this.resizeObserver.observe(this._chartContainer.nativeElement);
    this.updateChartData();
  }

  loadCandles() {
    this.stockService.getCandles(this.symbol, this.selectedPeriod).subscribe(c => {
      this.candles = c;
      this.updateChartData();
    });
  }
  
  updateChartData() {
    if (!this.candlestickSeries || !this.candles.length) return;
    
    // transform into lightweight-charts format
    const uniqueTimes = new Set<number>();
    const chartData = this.candles.map(c => ({
      time: Math.floor(new Date(c.date).getTime() / 1000) as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close
    }))
    .filter(c => {
      // lightweight-charts will crash if duplicate times are pushed
      if (uniqueTimes.has(c.time as number)) return false;
      uniqueTimes.add(c.time as number);
      return true;
    })
    .sort((a, b) => (a.time as number) - (b.time as number));
    
    this.candlestickSeries.setData(chartData);
    this.chart?.timeScale().fitContent();
  }

  setPeriod(p: string) { this.selectedPeriod = p; this.loadCandles(); }

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
