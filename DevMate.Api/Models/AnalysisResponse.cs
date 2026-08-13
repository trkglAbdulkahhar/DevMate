namespace DevMate.Api.Models;

public class AnalysisResponse{
    public string RiskLevel { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public List<string> BreakingChanges { get; set; } = new();
    public List<string> Recommendations { get; set; } = new();
}