using Microsoft.AspNetCore.Mvc;
using StockExchange.Models;
using StockExchange.Services;

namespace StockExchange.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StocksController : ControllerBase
{
    private readonly StockDataService _stockService;

    public StocksController(StockDataService stockService)
    {
        _stockService = stockService;
    }

    [HttpGet]
    public ActionResult<IEnumerable<Stock>> GetAll([FromQuery] string? sector, [FromQuery] string? search)
    {
        var stocks = _stockService.GetAllStocks();
        if (!string.IsNullOrWhiteSpace(sector))
            stocks = stocks.Where(s => s.Sector.Equals(sector, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(search))
            stocks = stocks.Where(s => 
                s.Symbol.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                s.Name.Contains(search, StringComparison.OrdinalIgnoreCase));
        return Ok(stocks.OrderByDescending(s => s.MarketCap));
    }

    [HttpGet("{symbol}")]
    public ActionResult<Stock> GetStock(string symbol)
    {
        var stock = _stockService.GetStock(symbol);
        if (stock == null) return NotFound();
        return Ok(stock);
    }

    [HttpGet("{symbol}/candles")]
    public ActionResult<IEnumerable<StockCandle>> GetCandles(string symbol, [FromQuery] string period = "1M")
    {
        var stock = _stockService.GetStock(symbol);
        if (stock == null) return NotFound();
        return Ok(_stockService.GetCandles(symbol, period));
    }

    [HttpGet("market/summary")]
    public ActionResult<object> GetMarketSummary()
    {
        var stocks = _stockService.GetAllStocks().ToList();
        return Ok(new
        {
            TotalStocks = stocks.Count,
            Advancing = stocks.Count(s => s.Change > 0),
            Declining = stocks.Count(s => s.Change < 0),
            Unchanged = stocks.Count(s => s.Change == 0),
            TopGainers = stocks.OrderByDescending(s => s.ChangePercent).Take(5),
            TopLosers = stocks.OrderBy(s => s.ChangePercent).Take(5),
            MostActive = stocks.OrderByDescending(s => s.Volume).Take(5),
            Indices = new[]
            {
                new { Name = "S&P 500", Value = 5248.32m, Change = 0.52m },
                new { Name = "NASDAQ", Value = 16421.85m, Change = 0.73m },
                new { Name = "DOW", Value = 39127.14m, Change = 0.31m },
                new { Name = "VIX", Value = 13.42m, Change = -2.1m }
            }
        });
    }

    [HttpGet("sectors")]
    public ActionResult<IEnumerable<object>> GetSectors()
    {
        var stocks = _stockService.GetAllStocks().ToList();
        var sectors = stocks
            .GroupBy(s => s.Sector)
            .Select(g => new
            {
                Sector = g.Key,
                Count = g.Count(),
                AverageChange = Math.Round(g.Average(s => s.ChangePercent), 2),
                TotalMarketCap = g.Sum(s => s.MarketCap)
            })
            .OrderByDescending(s => s.TotalMarketCap);
        return Ok(sectors);
    }
}
