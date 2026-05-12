namespace StockExchange.Services;

public class PriceUpdateService : BackgroundService
{
    private readonly StockDataService _stockService;
    private readonly ILogger<PriceUpdateService> _logger;

    public PriceUpdateService(StockDataService stockService, ILogger<PriceUpdateService> logger)
    {
        _stockService = stockService;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Price update service started");
        while (!stoppingToken.IsCancellationRequested)
        {
            _stockService.SimulatePriceUpdate();
            await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
        }
    }
}
