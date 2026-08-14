using DevMate.Api.Models;
using System.Text.Json;
using System.Text;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
var builder = WebApplication.CreateBuilder(args);


// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>{
    options.AddPolicy("AllowReact", policy =>
    policy.AllowAnyOrigin()
    .AllowAnyMethod()
    .AllowAnyHeader());
});

builder.Services.AddRateLimiter(options =>{
    options.AddPolicy("IpLimit", context =>{
        var clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(clientIp, _ => 
        new FixedWindowRateLimiterOptions{
            PermitLimit = 1,
            Window = TimeSpan.FromSeconds(30),
            QueueLimit = 0
        });
    });

    options.OnRejected = async (context, token) =>{
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsJsonAsync(new {
            detail = "Cok fazla istek attiniz. Lutfen 30 saniye sonra tekrar deneyiniz."
        }, token);
    };

});


DotNetEnv.Env.Load();
var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// app.UseHttpsRedirection(); // Https uyarisi vermemesi icin kapatildi
app.UseCors("AllowReact");
app.UseRateLimiter();

app.MapPost("/api/analyze", async (AnalysisRequest request , HttpContext context) =>{
    // var response = new AnalysisResponse{
    //     RiskLevel = "Medium",
    //     Summary = "Bu bir test (mock) yanıtıdır. Gerçek AI analizi henüz bağlanmadı. Ancak gelen veride kırılma riski (breaking change) tespit ettim.",
    //     BreakingChanges = new List<string> { "'name' alani silinmis.Istemciler hata alabilir"},
    //     Recommendations = new List<string> { "'name' alanini tamamen silmek yerine 'depracated' olarak isaretleyin"},        
    // };

    if(context.Request.ContentLength > 5 * 1024 * 1024)
        return Results.StatusCode(StatusCodes.Status413PayloadTooLarge);

    var apiKey = Environment.GetEnvironmentVariable("GROQ_API_KEY");
    if(string.IsNullOrEmpty(apiKey))
        return Results.StatusCode(StatusCodes.Status401Unauthorized);
        
    var differences = JsonSerializer.Serialize(request.Differences);

            var systemPrompt = @"Sen zeki ve analitik düşünen bir Yazılım Mimarı ve API Güvenlik Uzmanısın.
    Amacın sana verilen iki JSON dosyası arasındaki farkları (eklenen, silinen, değişen alanlar) inceleyip, bu değişikliklerin sistemin bütünlüğüne ve güvenliğine olan etkilerini yorumlamaktır.
    
    KURALLAR:
    1. Ezbere veya basmakalıp cümleler kurma. Her bir değişikliğin arka planında ne yatabileceğini, sistemin diğer parçalarını (eski istemciler, veritabanı, güvenlik katmanları) nasıl etkileyebileceğini kendi mühendislik zekanla analiz et.
    2. 'RiskLevel' alanını, yaptığın analizin ciddiyetine göre 'High', 'Medium' veya 'Low' olarak belirle.
    3. 'Summary' (Özet) kısmında; sistemde nelerin değişip nelerin değişmediğini, bu versiyon geçişinin genel olarak neyi amaçladığını anlatan akıcı bir özet yaz.
    4. 'BreakingChanges' (Kırılmalar) kısmında; sistemin çökmesine veya hata vermesine yol açabilecek kritik değişiklikleri yorumla. Sadece alan isimlerini listeleme, bu değişikliğin arka planda neyi bozabileceğini (Örn: silinen bir alan yüzünden yetkilendirme veya loglama mekanizmalarının nasıl hata verebileceğini) kendi zekanla kurgula ve anlat.
    5. 'Recommendations' (Öneriler) kısmında; yapıcı ve modern mimari çözümler üret. Örneğin silinen bir özellik varsa, bunun yerine verilerin nereye taşınabileceğini, yeni mimarinin nasıl kurgulanabileceğini veya geriye dönük uyumluluğun (backward compatibility) nasıl sağlanabileceğini kendi uzmanlığınla tavsiye et.
    
    BİREBİR aşağıdaki JSON formatında, Markdown karakterleri (```json) kullanmadan, sadece ham JSON objesi olarak Türkçe cevap dön:
    {
        ""RiskLevel"": ""High"",
        ""Summary"": ""..."",
        ""BreakingChanges"": [""..."", ""...""],
        ""Recommendations"": [""..."", ""...""]
    }
    Not: Kırılma riski yoksa ilgili listeyi boş dön.";



    var openAiRequest = new {
        model = "llama-3.1-8b-instant",
        messages = new [] {
            new { role = "system" , content = systemPrompt},
            new { role = "user" , content = $"iste JSON farkliliklari:\n{differences}"}
        },
        response_format = new { type = "json_object"},
        temperature = 0.2
    };

    using var httpClient = new HttpClient();
    httpClient.Timeout = TimeSpan.FromSeconds(30);
    httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

    var content = new StringContent(JsonSerializer.Serialize(openAiRequest) , 
    Encoding.UTF8, "application/json");

    HttpResponseMessage openAiResponse;

    try{

        openAiResponse = await 
        httpClient.PostAsync("https://api.groq.com/openai/v1/chat/completions", content);
    
    }    
    
    catch(TaskCanceledException){

        return Results.StatusCode(StatusCodes.Status504GatewayTimeout);

    }

    if(!openAiResponse.IsSuccessStatusCode)
    {
        return Results.StatusCode(StatusCodes.Status502BadGateway);
    }

    var jsonString = await openAiResponse.Content.ReadAsStringAsync();
    using var jsonDoc = JsonDocument.Parse(jsonString);
    var aiMessage = jsonDoc.RootElement.GetProperty("choices")
    [0].GetProperty("message").GetProperty("content").GetString();

    var options = new JsonSerializerOptions{ PropertyNameCaseInsensitive = true};
    
    try{
        var finalResponse = JsonSerializer.Deserialize<AnalysisResponse>
        (aiMessage!, options);
        if(finalResponse == null) 
            throw new JsonException();
        return Results.Ok(finalResponse);
    }

    catch(JsonException){
        var fallbackResponse = new AnalysisResponse {
            RiskLevel = "Medium",
            Summary = "AI analizi sırasında format hatası oluştu. Lütfen değişiklikleri manuel inceleyin.",
            BreakingChanges = new List<string>(),
            Recommendations = new List<string> { "Sistemi varsayılan güvenlik ayarlarına çekin." }
        };
        return Results.Ok(fallbackResponse);
    }

}).RequireRateLimiting("IpLimit");

app.Run();

// record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
// {
//     public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
// }
