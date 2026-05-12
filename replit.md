# StockEx — Stock Exchange App

A sophisticated stock exchange web application with real-time price simulation, built with Angular (frontend) and ASP.NET Core C# (backend).

## Run & Operate

- `Start application` workflow — Angular frontend (port 4200, proxies /api to C# backend)
- `C# Stock API` workflow — ASP.NET Core Web API (port 5001)
- Frontend available at the root preview URL
- C# API available at `/api/...`

## Stack

- **Frontend**: Angular 17, TypeScript, SCSS
- **Backend**: ASP.NET Core 8 Web API, C#
- **Real-time**: Background service simulates live price changes every 2 seconds
- **Angular polled refresh**: Every 3 seconds for live price updates

## Where things live

- `stock-exchange/` — Angular frontend app
  - `src/app/pages/` — Dashboard, Market, StockDetail, Portfolio, Orders
  - `src/app/services/` — StockService, PortfolioService
  - `src/app/models/` — TypeScript interfaces
  - `src/app/pipes/` — FormatNumberPipe
  - `proxy.conf.json` — Proxies `/api` to C# backend at localhost:5001
- `stock-exchange-api/StockExchange/` — C# ASP.NET Core backend
  - `Controllers/` — StocksController, PortfolioController
  - `Services/` — StockDataService, PortfolioService, PriceUpdateService
  - `Models/` — Stock, Portfolio, Order

## Architecture decisions

- Angular polling (3s interval) over WebSockets for simplicity; easily upgradeable to SignalR
- In-memory data store with 25 pre-seeded S&P 500-like stocks; no database needed
- Background service runs price simulation every 2 seconds
- Portfolio starts with $100k cash and 5 pre-seeded positions
- C# API uses CORS `AllowAnyOrigin` for dev convenience

## Product

- **Dashboard**: Market indices, breadth (advancing/declining), top gainers/losers, most active
- **Market**: Full stock list with sortable columns, 52-week range bars, search & sector filter
- **Stock Detail**: Live price, interactive SVG price chart (1W/1M/3M/6M/1Y), all stats, buy/sell panel
- **Portfolio**: Holdings with P&L, allocation breakdown, total return
- **Orders**: Full order history with stats

## User preferences

- Angular + C# stack (user specifically requested)
- Professional, dark theme UI

## Gotchas

- Angular dev server proxies `/api/*` to `localhost:5001` (C# backend) via `proxy.conf.json`
- Both workflows must be running for the app to work
- `NG_CLI_ANALYTICS=false` env var needed to suppress Angular CLI analytics prompt on startup
- C# decimal arithmetic: always use `m` suffix or explicit `(decimal)` cast — no implicit decimal/double mixing
