using StockExchange.Models;

namespace StockExchange.Services;

public class StockDataService
{
    private readonly Dictionary<string, Stock> _stocks = new();
    private readonly Dictionary<string, List<StockCandle>> _candles = new();
    private readonly Random _random = new();
    private readonly object _lock = new();

    private static readonly (string Symbol, string Name, string Sector, decimal BasePrice, long MarketCap, decimal PE, decimal Div, decimal WeekHigh52, decimal WeekLow52)[] StockData =
    [
        ("AAPL", "Apple Inc.", "Technology", 189.50m, 2950000000000L, 31.2m, 0.44m, 199.62m, 143.90m),
        ("MSFT", "Microsoft Corporation", "Technology", 415.20m, 3080000000000L, 36.8m, 0.72m, 430.82m, 309.45m),
        ("GOOGL", "Alphabet Inc.", "Technology", 168.30m, 2100000000000L, 24.1m, 0.0m, 191.75m, 120.21m),
        ("AMZN", "Amazon.com Inc.", "Consumer Discretionary", 196.40m, 2050000000000L, 58.3m, 0.0m, 201.20m, 118.35m),
        ("NVDA", "NVIDIA Corporation", "Technology", 875.40m, 2150000000000L, 73.5m, 0.04m, 974.00m, 373.53m),
        ("META", "Meta Platforms Inc.", "Communication Services", 530.20m, 1350000000000L, 27.4m, 0.0m, 589.29m, 279.40m),
        ("TSLA", "Tesla Inc.", "Consumer Discretionary", 178.60m, 568000000000L, 48.2m, 0.0m, 278.98m, 138.80m),
        ("BRK.B", "Berkshire Hathaway", "Financials", 390.10m, 853000000000L, 22.1m, 0.0m, 394.88m, 312.97m),
        ("JPM", "JPMorgan Chase & Co.", "Financials", 201.30m, 578000000000L, 12.4m, 2.2m, 210.51m, 135.19m),
        ("V", "Visa Inc.", "Financials", 279.40m, 562000000000L, 31.6m, 0.78m, 290.96m, 225.15m),
        ("JNJ", "Johnson & Johnson", "Healthcare", 148.20m, 358000000000L, 15.3m, 3.0m, 175.97m, 143.13m),
        ("WMT", "Walmart Inc.", "Consumer Staples", 68.90m, 552000000000L, 35.2m, 1.2m, 72.31m, 48.67m),
        ("PG", "Procter & Gamble", "Consumer Staples", 161.50m, 383000000000L, 27.8m, 2.4m, 167.24m, 131.30m),
        ("MA", "Mastercard Inc.", "Financials", 466.80m, 432000000000L, 37.2m, 0.64m, 481.88m, 351.64m),
        ("HD", "The Home Depot", "Consumer Discretionary", 345.20m, 345000000000L, 23.5m, 2.6m, 395.95m, 273.88m),
        ("CVX", "Chevron Corporation", "Energy", 159.40m, 303000000000L, 14.2m, 3.8m, 189.68m, 139.62m),
        ("LLY", "Eli Lilly and Company", "Healthcare", 780.60m, 743000000000L, 108.4m, 0.66m, 858.71m, 481.44m),
        ("ABBV", "AbbVie Inc.", "Healthcare", 172.30m, 305000000000L, 19.8m, 3.6m, 181.72m, 129.24m),
        ("BAC", "Bank of America", "Financials", 38.40m, 303000000000L, 13.6m, 2.4m, 39.14m, 24.96m),
        ("KO", "The Coca-Cola Company", "Consumer Staples", 61.80m, 268000000000L, 24.3m, 3.1m, 64.99m, 51.55m),
        ("PFE", "Pfizer Inc.", "Healthcare", 27.60m, 155000000000L, 11.2m, 5.8m, 54.93m, 25.20m),
        ("DIS", "The Walt Disney Company", "Communication Services", 113.50m, 207000000000L, 71.3m, 0.0m, 123.74m, 78.73m),
        ("NFLX", "Netflix Inc.", "Communication Services", 618.30m, 268000000000L, 46.8m, 0.0m, 639.00m, 344.73m),
        ("ADBE", "Adobe Inc.", "Technology", 472.40m, 208000000000L, 44.2m, 0.0m, 587.75m, 419.87m),
        ("INTC", "Intel Corporation", "Technology", 31.20m, 132000000000L, 21.5m, 1.0m, 51.28m, 29.73m),
    ];

    public StockDataService()
    {
        InitializeStocks();
        InitializeCandles();
    }

    private void InitializeStocks()
    {
        foreach (var s in StockData)
        {
            var prevClose = s.BasePrice * (1 + (decimal)(_random.NextDouble() * 0.02 - 0.01));
            var change = s.BasePrice - prevClose;
            _stocks[s.Symbol] = new Stock
            {
                Symbol = s.Symbol,
                Name = s.Name,
                Sector = s.Sector,
                Price = s.BasePrice,
                PreviousClose = prevClose,
                Open = prevClose * (1 + (decimal)(_random.NextDouble() * 0.01 - 0.005)),
                High = s.BasePrice * (1 + (decimal)(_random.NextDouble() * 0.015)),
                Low = s.BasePrice * (1 - (decimal)(_random.NextDouble() * 0.015)),
                Change = change,
                ChangePercent = prevClose == 0 ? 0 : (change / prevClose) * 100,
                Volume = (long)(s.MarketCap / s.BasePrice * 0.005m * (decimal)(_random.NextDouble() * 0.5 + 0.75)),
                MarketCap = s.MarketCap,
                PeRatio = s.PE,
                DividendYield = s.Div,
                WeekHigh52 = s.WeekHigh52,
                WeekLow52 = s.WeekLow52
            };
        }
    }

    private void InitializeCandles()
    {
        foreach (var symbol in _stocks.Keys)
        {
            var candles = new List<StockCandle>();
            var basePrice = _stocks[symbol].Price;
            var currentPrice = basePrice * (decimal)(0.7 + _random.NextDouble() * 0.6);

            for (int i = 365; i >= 0; i--)
            {
                var date = DateTime.UtcNow.Date.AddDays(-i);
                if (date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday) continue;

                var change = (decimal)(_random.NextDouble() * 0.04 - 0.02);
                var open = currentPrice;
                var close = open * (1 + change);
                var high = Math.Max(open, close) * (1 + (decimal)(_random.NextDouble() * 0.01));
                var low = Math.Min(open, close) * (1 - (decimal)(_random.NextDouble() * 0.01));

                candles.Add(new StockCandle
                {
                    Date = date,
                    Open = Math.Round(open, 2),
                    High = Math.Round(high, 2),
                    Low = Math.Round(low, 2),
                    Close = Math.Round(close, 2),
                    Volume = (long)(_random.NextDouble() * 50000000 + 10000000)
                });
                currentPrice = close;
            }
            _candles[symbol] = candles;
        }
    }

    public IEnumerable<Stock> GetAllStocks()
    {
        lock (_lock)
            return _stocks.Values.ToList();
    }

    public Stock? GetStock(string symbol)
    {
        lock (_lock)
            return _stocks.TryGetValue(symbol.ToUpper(), out var stock) ? stock : null;
    }

    public IEnumerable<StockCandle> GetCandles(string symbol, string period = "1M")
    {
        lock (_lock)
        {
            if (!_candles.TryGetValue(symbol.ToUpper(), out var candles)) return [];
            var days = period switch
            {
                "1W" => 7,
                "1M" => 30,
                "3M" => 90,
                "6M" => 180,
                "1Y" => 365,
                _ => 30
            };
            return candles.TakeLast(days).ToList();
        }
    }

    public void SimulatePriceUpdate()
    {
        lock (_lock)
        {
            foreach (var stock in _stocks.Values)
            {
                var volatility = 0.003m;
                var change = stock.Price * volatility * (decimal)(_random.NextDouble() * 2 - 1);
                var newPrice = Math.Max(stock.Price + change, 0.01m);
                newPrice = Math.Round(newPrice, 2);

                stock.Change = newPrice - stock.PreviousClose;
                stock.ChangePercent = stock.PreviousClose == 0 ? 0 : Math.Round((stock.Change / stock.PreviousClose) * 100, 2);
                stock.High = Math.Max(stock.High, newPrice);
                stock.Low = Math.Min(stock.Low, newPrice);
                stock.Volume += (long)(_random.NextDouble() * 100000);
                stock.Price = newPrice;
            }
        }
    }
}
