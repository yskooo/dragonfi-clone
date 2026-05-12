import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { PortfolioService } from '../../services/portfolio.service';
import { Portfolio } from '../../models/portfolio.model';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, RouterLink, FormatNumberPipe],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.scss'
})
export class PortfolioComponent implements OnInit, OnDestroy {
  portfolio: Portfolio | null = null;
  loading = true;
  private sub?: Subscription;

  constructor(private portfolioService: PortfolioService) {}

  ngOnInit() {
    this.sub = this.portfolioService.getLivePortfolio().subscribe({
      next: data => { this.portfolio = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  get allocationData() {
    if (!this.portfolio) return [];
    const total = this.portfolio.totalValue;
    return this.portfolio.holdings.map(h => ({
      symbol: h.symbol,
      pct: total ? (h.currentValue / total) * 100 : 0,
      value: h.currentValue
    })).sort((a, b) => b.pct - a.pct);
  }

  get cashPct(): number {
    if (!this.portfolio) return 0;
    return (this.portfolio.cashBalance / this.portfolio.totalValue) * 100;
  }
}
