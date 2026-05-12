import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { StockService } from '../../services/stock.service';
import { Stock, SectorSummary } from '../../models/stock.model';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';

@Component({
  selector: 'app-market',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, FormatNumberPipe],
  templateUrl: './market.component.html',
  styleUrl: './market.component.scss'
})
export class MarketComponent implements OnInit, OnDestroy {
  stocks: Stock[] = [];
  sectors: SectorSummary[] = [];
  loading = true;
  searchQuery = '';
  selectedSector = '';
  sortColumn = 'marketCap';
  sortDir: 'asc' | 'desc' = 'desc';
  private sub?: Subscription;

  constructor(private stockService: StockService) {}

  ngOnInit() {
    this.stockService.getSectors().subscribe(s => this.sectors = s);
    this.sub = this.stockService.getLiveStocks().subscribe({
      next: data => { this.stocks = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  get filteredStocks(): Stock[] {
    let result = [...this.stocks];
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    }
    if (this.selectedSector) {
      result = result.filter(s => s.sector === this.selectedSector);
    }
    result.sort((a, b) => {
      const av = (a as any)[this.sortColumn];
      const bv = (b as any)[this.sortColumn];
      return this.sortDir === 'desc' ? bv - av : av - bv;
    });
    return result;
  }

  sort(col: string) {
    if (this.sortColumn === col) this.sortDir = this.sortDir === 'desc' ? 'asc' : 'desc';
    else { this.sortColumn = col; this.sortDir = 'desc'; }
  }

  sortIcon(col: string): string {
    if (this.sortColumn !== col) return '';
    return this.sortDir === 'desc' ? ' ↓' : ' ↑';
  }

  clearFilters() { this.searchQuery = ''; this.selectedSector = ''; }
  trackBySymbol(_: number, stock: Stock) { return stock.symbol; }
}
