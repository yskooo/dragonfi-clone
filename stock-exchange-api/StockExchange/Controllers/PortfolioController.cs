using Microsoft.AspNetCore.Mvc;
using StockExchange.Models;
using StockExchange.Services;

namespace StockExchange.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PortfolioController : ControllerBase
{
    private readonly PortfolioService _portfolioService;

    public PortfolioController(PortfolioService portfolioService)
    {
        _portfolioService = portfolioService;
    }

    [HttpGet]
    public ActionResult<Portfolio> GetPortfolio()
    {
        return Ok(_portfolioService.GetPortfolio());
    }

    [HttpPost("trade")]
    public ActionResult<Order> ExecuteTrade([FromBody] TradeRequest request)
    {
        var (success, message, order) = _portfolioService.ExecuteTrade(request);
        if (!success) return BadRequest(new { message });
        return Ok(order);
    }

    [HttpGet("orders")]
    public ActionResult<IEnumerable<Order>> GetOrders()
    {
        return Ok(_portfolioService.GetOrders());
    }

    [HttpGet("transactions")]
    public ActionResult<IEnumerable<TransactionEntry>> GetTransactions()
    {
        return Ok(_portfolioService.GetTransactions());
    }

    [HttpPost("deposit")]
    public ActionResult<TransactionEntry> Deposit([FromBody] MoneyRequest request)
    {
        var (success, message, transaction) = _portfolioService.Deposit(request.Amount);
        if (!success) return BadRequest(new { message });
        return Ok(transaction);
    }

    [HttpPost("withdraw")]
    public ActionResult<TransactionEntry> Withdraw([FromBody] MoneyRequest request)
    {
        var (success, message, transaction) = _portfolioService.Withdraw(request.Amount);
        if (!success) return BadRequest(new { message });
        return Ok(transaction);
    }
}
