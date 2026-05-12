using StockExchange.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSingleton<StockDataService>();
builder.Services.AddSingleton<PortfolioService>();
builder.Services.AddHostedService<PriceUpdateService>();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

app.UseCors();
app.MapControllers();

var port = Environment.GetEnvironmentVariable("API_PORT") ?? "5001";
app.Run($"http://0.0.0.0:{port}");
