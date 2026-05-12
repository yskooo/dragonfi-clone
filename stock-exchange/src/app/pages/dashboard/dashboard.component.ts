import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { StockService } from '../../services/stock.service';
import { PortfolioService } from '../../services/portfolio.service';
import { MarketSummary, Stock } from '../../models/stock.model';
import { Portfolio } from '../../models/portfolio.model';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';

export interface NewsItem {
  source: string;
  timeAgo: string;
  headline: string;
  relatedSymbols: string[];
}

export interface CalendarItem {
  symbol: string;
  type: string;
  paymentDay: string;
  paymentMonth: string;
  dividendRate: string;
  exDividendDate: string;
  recordDate: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormatNumberPipe, CurrencyPipe, DatePipe, DecimalPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  summary: MarketSummary | null = null;
  portfolio: Portfolio | null = null;
  loading = true;
  activeMoversTab: 'gainers' | 'losers' = 'gainers';
  activeHoldingsTab: 'stocks' | 'funds' = 'stocks';
  activeCalendarTab: 'dividends' | 'rights' | 'ipo' = 'dividends';
  currentDate = new Date();
  private subs: Subscription[] = [];

  newsItems: NewsItem[] = [
    {
      source: 'Reuters',
      timeAgo: '2h ago',
      headline: 'Apple Reports Record Q1 Earnings, Beats Wall Street Estimates by 12%',
      relatedSymbols: ['AAPL', 'MSFT', 'GOOGL']
    },
    {
      source: 'Bloomberg',
      timeAgo: '4h ago',
      headline: 'Federal Reserve Holds Rates Steady, Eyes Q3 Cut as Inflation Cools',
      relatedSymbols: ['JPM', 'BAC']
    },
    {
      source: 'CNBC',
      timeAgo: '5h ago',
      headline: 'NVIDIA Surpasses $3T Market Cap on Record AI Infrastructure Demand',
      relatedSymbols: ['NVDA', 'AMD']
    },
    {
      source: 'WSJ',
      timeAgo: '7h ago',
      headline: 'Tesla Announces New Gigafactory Expansion in Texas, Shares Climb',
      relatedSymbols: ['TSLA']
    }
  ];

  calendarItems: CalendarItem[] = [
    {
      symbol: 'AAPL',
      type: 'Cash',
      paymentDay: '16',
      paymentMonth: 'May',
      dividendRate: '$0.25',
      exDividendDate: 'May 10, 2026',
      recordDate: 'May 11, 2026'
    },
    {
      symbol: 'MSFT',
      type: 'Cash',
      paymentDay: '12',
      paymentMonth: 'Jun',
      dividendRate: '$0.75',
      exDividendDate: 'May 15, 2026',
      recordDate: 'May 16, 2026'
    },
    {
      symbol: 'JNJ',
      type: 'Cash',
      paymentDay: '03',
      paymentMonth: 'Jun',
      dividendRate: '$1.24',
      exDividendDate: 'May 27, 2026',
      recordDate: 'May 28, 2026'
    }
  ];

  private symbolColors: Record<string, string> = {
    'AAPL': '#555555', 'MSFT': '#0078d4', 'GOOGL': '#4285f4', 'AMZN': '#ff9900',
    'TSLA': '#cc0000', 'NVDA': '#76b900', 'META': '#0668e1', 'JPM': '#1a3a6e',
    'BAC': '#e31837', 'AMD': '#ed1c24', 'NFLX': '#e50914', 'JNJ': '#d40000',
    'V': '#1a1f71', 'WMT': '#0071ce', 'XOM': '#c02427', 'DIS': '#113ccf',
    'HD': '#f96302', 'PFE': '#0064b5', 'KO': '#f40009', 'MA': '#eb001b'
  };

  constructor(
    private stockService: StockService,
    private portfolioService: PortfolioService
  ) {}

  ngOnInit() {
    this.subs.push(
      this.stockService.getLiveMarketSummary().subscribe({
        next: data => { this.summary = data; this.loading = false; },
        error: () => { this.loading = false; }
      }),
      this.portfolioService.getLivePortfolio().subscribe({
        next: data => { this.portfolio = data; }
      })
    );
    setInterval(() => this.currentDate = new Date(), 60000);
  }

  ngOnDestroy() { this.subs.forEach(s => s.unsubscribe()); }

  get displayedMovers(): Stock[] {
    if (!this.summary) return [];
    return this.activeMoversTab === 'gainers' ? this.summary.topGainers : this.summary.topLosers;
  }

  getSymbolInitials(symbol: string): string {
    return symbol.slice(0, 2);
  }

  getSymbolColor(symbol: string): string {
    return this.symbolColors[symbol] ?? '#6b7280';
  }
}
