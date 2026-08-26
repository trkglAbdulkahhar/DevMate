namespace DevMate.Api.Models;

public class JwtAnalysisResponse {
    public string RiskLevel { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public List<JwtFinding> Findings { get; set; } = new();
}

public class JwtFinding{
    public string Severity { get; set; } = string.Empty;
    public string Claim { get; set; } = string.Empty;
    public string Issue { get; set; } = string.Empty;
    public string Recommendation { get; set; } = string.Empty; 
}