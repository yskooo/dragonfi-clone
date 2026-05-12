import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { PortfolioService } from '../../services/portfolio.service';
import { Transaction } from '../../models/portfolio.model';

type TabId = 'transactions' | 'requests' | 'dividend' | 'funds';
type TimeFilter = '7d' | '14d' | '30d' | 'month';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe, DecimalPipe],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss'
})
export class TransactionsComponent implements OnInit, OnDestroy {
  transactions: Transaction[] = [];
  loading = true;
  activeTab: TabId = 'transactions';
  timeFilter: TimeFilter = '30d';

  depositAmount = 1000;
  withdrawAmount = 1000;
  depositBusy = false;
  withdrawBusy = false;
  message = '';
  private sub?: Subscription;

  constructor(private portfolioService: PortfolioService) {}

  ngOnInit() {
    this.loadTransactions();
    this.sub = this.portfolioService.tradeExecuted.subscribe(() => this.loadTransactions());
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  loadTransactions() {
    this.loading = true;
    this.portfolioService.getTransactions().subscribe({
      next: data => {
        this.transactions = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  get filteredTransactions(): Transaction[] {
    const now = new Date().getTime();
    let days = 30;
    if (this.timeFilter === '7d') days = 7;
    else if (this.timeFilter === '14d') days = 14;

    const cutoff = now - days * 24 * 60 * 60 * 1000;
    return this.transactions.filter(t => new Date(t.createdAt).getTime() > cutoff);
  }

  submitDeposit() {
    if (this.depositAmount <= 0 || this.depositBusy) return;
    this.depositBusy = true;
    this.message = '';
    this.portfolioService.deposit(this.depositAmount).subscribe({
      next: () => {
        this.depositBusy = false;
        this.message = `Deposited $${this.depositAmount.toFixed(2)}.`;
        this.loadTransactions();
      },
      error: err => {
        this.depositBusy = false;
        this.message = err?.error?.message ?? 'Deposit failed.';
      }
    });
  }

  submitWithdraw() {
    if (this.withdrawAmount <= 0 || this.withdrawBusy) return;
    this.withdrawBusy = true;
    this.message = '';
    this.portfolioService.withdraw(this.withdrawAmount).subscribe({
      next: () => {
        this.withdrawBusy = false;
        this.message = `Withdrew $${this.withdrawAmount.toFixed(2)}.`;
        this.loadTransactions();
      },
      error: err => {
        this.withdrawBusy = false;
        this.message = err?.error?.message ?? 'Withdrawal failed.';
      }
    });
  }

  setTab(tab: TabId) {
    this.activeTab = tab;
  }
}
