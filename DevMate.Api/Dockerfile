FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Sadece csproj'u kopyalayıp bağımlılıkları yükle (Docker cache optimizasyonu)
COPY ["DevMate.Api.csproj", "./"]
RUN dotnet restore "DevMate.Api.csproj"

# Kalan tüm dosyaları kopyala ve build al
COPY . .
RUN dotnet publish "DevMate.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime imajı
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Render ve .NET 9 varsayılan portu 8080'dir
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "DevMate.Api.dll"]
