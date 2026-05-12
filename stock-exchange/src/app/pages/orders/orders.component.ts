import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { PortfolioService } from '../../services/portfolio.service';
import { Order } from '../../models/portfolio.model';
import { FormatNumberPipe } from '../../pipes/format-number.pipe';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, FormatNumberPipe],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  loading = true;
  private sub?: Subscription;

  constructor(private portfolioService: PortfolioService) {}

  ngOnInit() {
    this.loadOrders();
    this.sub = this.portfolioService.tradeExecuted.subscribe(() => this.loadOrders());
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  loadOrders() {
    this.portfolioService.getOrders().subscribe({
      next: data => { this.orders = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  get buyCount() { return this.orders.filter(o => o.type === 'BUY').length; }
  get sellCount() { return this.orders.filter(o => o.type === 'SELL').length; }
  get totalVolume() { return this.orders.reduce((sum, o) => sum + o.total, 0); }
}
