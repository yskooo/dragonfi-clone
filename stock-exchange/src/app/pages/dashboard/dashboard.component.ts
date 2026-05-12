import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { StockService } from '../../services/stock.service';
import { MarketSummary, Stock } from '../../models/stock.model';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormatNumberPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  summary: MarketSummary | null = null;
  loading = true;
  private sub?: Subscription;

  constructor(private stockService: StockService) {}

  ngOnInit() {
    this.sub = this.stockService.getLiveMarketSummary().subscribe({
      next: data => { this.summary = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  trackBySymbol(_: number, stock: Stock) { return stock.symbol; }
}
