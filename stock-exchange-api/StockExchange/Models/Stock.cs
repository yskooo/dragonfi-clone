namespace StockExchange.Models;

public class Stock
{
    public string Symbol { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Sector { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal Change { get; set; }
    public decimal ChangePercent { get; set; }
    public decimal Open { get; set; }
    public decimal High { get; set; }
    public decimal Low { get; set; }
    public decimal PreviousClose { get; set; }
    public long Volume { get; set; }
    public long MarketCap { get; set; }
    public decimal PeRatio { get; set; }
    public decimal DividendYield { get; set; }
    public decimal WeekHigh52 { get; set; }
    public decimal WeekLow52 { get; set; }
}

public class StockPrice
{
    public string Symbol { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public decimal Price { get; set; }
    public long Volume { get; set; }
}

public class StockCandle
{
    public DateTime Date { get; set; }
    public decimal Open { get; set; }
    public decimal High { get; set; }
    public decimal Low { get; set; }
    public decimal Close { get; set; }
    public long Volume { get; set; }
}
