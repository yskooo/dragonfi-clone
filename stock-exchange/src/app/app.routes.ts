import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'market',
    loadComponent: () => import('./pages/market/market.component').then(m => m.MarketComponent)
  },
  {
    path: 'stock/:symbol',
    loadComponent: () => import('./pages/stock-detail/stock-detail.component').then(m => m.StockDetailComponent)
  },
  {
    path: 'portfolio',
    loadComponent: () => import('./pages/portfolio/portfolio.component').then(m => m.PortfolioComponent)
  },
  {
    path: 'orders',
    loadComponent: () => import('./pages/orders/orders.component').then(m => m.OrdersComponent)
  },
  { path: '**', redirectTo: 'dashboard' }
];
