using DevMate.Api.Models;
using System.Text.Json;
using System.Text;
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

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// app.UseHttpsRedirection(); // Https uyarisi vermemesi icin kapatildi
app.UseCors("AllowReact");

app.MapPost("/api/analyze", async (AnalysisRequest request , IConfiguration config) =>{
    var response = new AnalysisResponse{
        RiskLevel = "Medium",
        Summary = "Bu bir test (mock) yanıtıdır. Gerçek AI analizi henüz bağlanmadı. Ancak gelen veride kırılma riski (breaking change) tespit ettim.",
        BreakingChanges = new List<string> { "'name' alani silinmis.Istemciler hata alabilir"},
        Recommendations = new List<string> { "'name' alanini tamamen silmek yerine 'depracated' olarak isaretleyin"},        
    };

    // var apiKey = config["Groq:ApiKey"]
    // if(string.IsNullOrEmpty(apiKey))
    //     return Results.Problem("Groq API Key eksik!");
        
    // var differences = JsonSerializer.Serialize(request.Differences);

    // var systemPrompt = @"Sen kıdemli bir yazılım mimarı ve JSON API şema analiz uzmanısın.
    // Sana iki JSON dosyası arasındaki farklar (Eklenen, Silinen ve Değişen alanlar) verilecek.
    // Bu farkları analiz et ve BİREBİR aşağıdaki JSON formatında, Markdown karakterleri (```json) kullanmadan, sadece ham JSON objesi olarak Türkçe cevap dön:
    // {
    //     ""RiskLevel"": ""High"" veya ""Medium"" veya ""Low"",
    //     ""Summary"": ""Değişikliklerin genel bir özeti ve sistemleri nasıl etkileyeceği (1-2 cümle)"",
    //     ""BreakingChanges"": [""Sistemi çökertmeye yol açabilecek alan silinmeleri veya tip değişiklikleri""],
    //     ""Recommendations"": [""Geliştirici için daha güvenli yapılandırma önerileri""]
    // }
    // Not: Eğer breaking change yoksa listeyi boş dön.";

    // var openAiRequest = new {
    //     model = "llama-3.1-8b-instant",
    //     messages = new [] {
    //         new { role = "system" , content = systemPrompt},
    //         new { role = "user" , content = $"iste JSON farkliliklari:\n{differences}"}
    //     },
    //     response_format = new { type = "json_object"},
    //     temperature = 0.2
    // };

    // using var httpClient = new HttpClient();
    // httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

    // var content = new StringContent(JsonSerializer.Serialize(openAiRequest) , 
    // Encoding.UTF8, "application/json");
    // var openAiResponse = await 
    // httpClient.PostAsync("https://api.groq.com/openai/v1/chat/completions", content);

    // if(!openAiResponse.IsSuccessStatusCode)
    // {
    //     var error = await openAiResponse.Content.ReadAsStringAsync();
    //     return Results.Problem($"Groq hatasi: {error}");
    // }

    // var jsonString = await openAiResponse.Content.ReadAsStringAsync();
    // using var jsonDoc = JsonDocument.Parse(jsonString);
    // var aiMessage = jsonDoc.RootElement.GetProperty("choices")
    // [0].GetProperty("message").GetProperty("content").GetString();

    // var options = new JsonSerializerOptions{ PropertyNameCaseInsensitive = true};
    // var finalResponse = JsonSerializer.Deserialize<AnalysisResponse>
    // (aiMessage!, options);

    return Results.Ok(response);
});

app.Run();

// record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
// {
//     public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
// }
