namespace StockExchange.Models;

public class Holding
{
    public string Symbol { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal AverageCost { get; set; }
    public decimal CurrentPrice { get; set; }
    public decimal TotalCost => Quantity * AverageCost;
    public decimal CurrentValue => Quantity * CurrentPrice;
    public decimal GainLoss => CurrentValue - TotalCost;
    public decimal GainLossPercent => TotalCost == 0 ? 0 : (GainLoss / TotalCost) * 100;
}

public class Portfolio
{
    public decimal CashBalance { get; set; }
    public List<Holding> Holdings { get; set; } = new();
    public decimal TotalInvested => Holdings.Sum(h => h.TotalCost);
    public decimal TotalValue => Holdings.Sum(h => h.CurrentValue) + CashBalance;
    public decimal TotalGainLoss => Holdings.Sum(h => h.GainLoss);
    public decimal TotalGainLossPercent => TotalInvested == 0 ? 0 : (TotalGainLoss / TotalInvested) * 100;
}

public class Order
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Symbol { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // BUY or SELL
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public decimal Total => Quantity * Price;
    public DateTime ExecutedAt { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "FILLED";
}

public class TradeRequest
{
    public string Symbol { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int Quantity { get; set; }
}
