# StockExchange

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.17.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

# StockExchange Localhost Guide

This repo has two apps:

- `stock-exchange` is the Angular frontend.
- `stock-exchange-api/StockExchange` is the C# backend API.

## Run the API

1. Open a terminal in `stock-exchange-api/StockExchange`.
2. Run `dotnet restore` if needed.
3. Start the server with `dotnet run`.
4. The API listens on `http://localhost:5001` by default because `Program.cs` binds to `API_PORT` or falls back to `5001`.

## Run the Angular app

1. Open a second terminal in `stock-exchange`.
2. Run `pnpm install` if needed.
3. Start the frontend with `pnpm start`.
4. Open `http://localhost:4200` in your browser.

The Angular dev server already proxies `/api` requests to `http://localhost:5001`, so the frontend and API can run independently on localhost.

## What changed in the app

- Added a `My Transactions` tab in the top navigation.
- Added a `My Transactions` page for Deposit and Withdrawal activity.
- The dashboard Deposit and Withdraw buttons now open the transactions page.
