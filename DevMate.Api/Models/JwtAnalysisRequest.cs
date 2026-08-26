namespace DevMate.Api.Models;

public class JwtAnalysisRequest { 
    public object? Header { get; set; }
    public object? Payload { get; set; }
    public List<DeterministicFinding>? DeterministicFindings { get; set; }
}

public class DeterministicFinding {
    public string Severity { get; set; } = string.Empty;
    public string Claim { get; set; } = string.Empty;
    public string Issue { get; set; } = string.Empty;
    public string Recommendation { get; set; } = string.Empty;
}