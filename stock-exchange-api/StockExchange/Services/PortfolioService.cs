using StockExchange.Models;

namespace StockExchange.Services;

public class PortfolioService
{
    private decimal _cashBalance = 100000m;
    private readonly Dictionary<string, (int Quantity, decimal AverageCost)> _holdings = new();
    private readonly List<Order> _orders = new();
    private readonly List<TransactionEntry> _transactions = new();
    private readonly StockDataService _stockService;
    private readonly object _lock = new();

    public PortfolioService(StockDataService stockService)
    {
        _stockService = stockService;
        SeedPortfolio();
    }

    private void SeedPortfolio()
    {
        // start with an initial deposit transaction so transaction history explains starting cash
        var startingCash = _cashBalance;
        _transactions.Add(new TransactionEntry
        {
            Type = "DEPOSIT",
            Amount = startingCash,
            BalanceAfter = _cashBalance,
            Note = "Initial funding",
            CreatedAt = DateTime.UtcNow.AddDays(-90)
        });

        var seedTrades = new[] {
            ("AAPL", 10, 150.0m), ("MSFT", 5, 380.0m), ("NVDA", 3, 600.0m),
            ("GOOGL", 8, 140.0m), ("TSLA", 6, 200.0m)
        };
        foreach (var (symbol, qty, cost) in seedTrades)
        {
            _holdings[symbol] = (qty, cost);
            _cashBalance -= qty * cost;
            _orders.Add(new Order
            {
                Symbol = symbol,
                Name = _stockService.GetStock(symbol)?.Name ?? symbol,
                Type = "BUY",
                Quantity = qty,
                Price = cost,
                ExecutedAt = DateTime.UtcNow.AddDays(-_orders.Count * 7 - 30)
            });
            // record the cash outflow as a transaction entry
            _transactions.Add(new TransactionEntry
            {
                Type = "WITHDRAWAL",
                Amount = qty * cost,
                BalanceAfter = _cashBalance,
                Note = $"Seed buy {qty} {symbol}",
                CreatedAt = DateTime.UtcNow.AddDays(-_orders.Count * 7 - 30)
            });
        }
    }

    public Portfolio GetPortfolio()
    {
        lock (_lock)
        {
            var holdings = _holdings.Select(kvp =>
            {
                var stock = _stockService.GetStock(kvp.Key);
                return new Holding
                {
                    Symbol = kvp.Key,
                    Name = stock?.Name ?? kvp.Key,
                    Quantity = kvp.Value.Quantity,
                    AverageCost = kvp.Value.AverageCost,
                    CurrentPrice = stock?.Price ?? 0
                };
            }).ToList();

            return new Portfolio
            {
                CashBalance = _cashBalance,
                Holdings = holdings
            };
        }
    }

    public (bool Success, string Message, Order? Order) ExecuteTrade(TradeRequest request)
    {
        lock (_lock)
        {
            var stock = _stockService.GetStock(request.Symbol);
            if (stock == null) return (false, "Stock not found", null);
            if (request.Quantity <= 0) return (false, "Invalid quantity", null);

            var total = stock.Price * request.Quantity;

            if (request.Type.ToUpper() == "BUY")
            {
                if (total > _cashBalance) return (false, "Insufficient funds", null);
                _cashBalance -= total;

                if (_holdings.TryGetValue(request.Symbol, out var existing))
                {
                    var newQty = existing.Quantity + request.Quantity;
                    var newAvg = ((existing.AverageCost * existing.Quantity) + (stock.Price * request.Quantity)) / newQty;
                    _holdings[request.Symbol] = (newQty, Math.Round(newAvg, 4));
                }
                else
                {
                    _holdings[request.Symbol] = (request.Quantity, stock.Price);
                }
            }
            else if (request.Type.ToUpper() == "SELL")
            {
                if (!_holdings.TryGetValue(request.Symbol, out var holding)) return (false, "No position to sell", null);
                if (holding.Quantity < request.Quantity) return (false, "Insufficient shares", null);

                _cashBalance += total;
                var remaining = holding.Quantity - request.Quantity;
                if (remaining == 0) _holdings.Remove(request.Symbol);
                else _holdings[request.Symbol] = (remaining, holding.AverageCost);
            }
            else
            {
                return (false, "Invalid order type", null);
            }

            var order = new Order
            {
                Symbol = request.Symbol,
                Name = stock.Name,
                Type = request.Type.ToUpper(),
                Quantity = request.Quantity,
                Price = stock.Price
            };
            _orders.Add(order);
            // record cash movement for the trade
            _transactions.Add(new TransactionEntry
            {
                Type = request.Type.ToUpper() == "BUY" ? "WITHDRAWAL" : "DEPOSIT",
                Amount = total,
                BalanceAfter = _cashBalance,
                Note = $"{request.Type.ToUpper()} {request.Quantity} {request.Symbol}",
                CreatedAt = DateTime.UtcNow
            });
            return (true, "Order executed", order);
        }
    }

    public (bool Success, string Message, TransactionEntry? Transaction) Deposit(decimal amount)
    {
        lock (_lock)
        {
            if (amount <= 0) return (false, "Deposit amount must be greater than zero", null);

            _cashBalance += amount;
            var transaction = new TransactionEntry
            {
                Type = "DEPOSIT",
                Amount = amount,
                BalanceAfter = _cashBalance,
                Note = "Cash deposit"
            };
            _transactions.Add(transaction);
            return (true, "Deposit completed", transaction);
        }
    }

    public (bool Success, string Message, TransactionEntry? Transaction) Withdraw(decimal amount)
    {
        lock (_lock)
        {
            if (amount <= 0) return (false, "Withdrawal amount must be greater than zero", null);
            if (amount > _cashBalance) return (false, "Insufficient cash balance", null);

            _cashBalance -= amount;
            var transaction = new TransactionEntry
            {
                Type = "WITHDRAWAL",
                Amount = amount,
                BalanceAfter = _cashBalance,
                Note = "Cash withdrawal"
            };
            _transactions.Add(transaction);
            return (true, "Withdrawal completed", transaction);
        }
    }

    public IEnumerable<Order> GetOrders() 
    {
        lock (_lock)
            return _orders.OrderByDescending(o => o.ExecutedAt).ToList();
    }

    public IEnumerable<TransactionEntry> GetTransactions()
    {
        lock (_lock)
            return _transactions.OrderByDescending(t => t.CreatedAt).ToList();
    }
}
