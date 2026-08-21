namespace DevMate.Api.Models;

public class LogEntryDto{
    public double Id { get; set; }
    public string Level { get; set; } = string.Empty;
    public string Timestamp { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public string? ExceptionType { get; set; } 
    public string? RootCause { get; set; } 
    public List<string>? FullStackTrace { get; set; }
    public bool IsTruncated { get; set; }
    public string Raw { get; set; } = string.Empty;
}

public class LogBatchAnalysisRequest{
    public List<LogEntryDto> Logs { get; set; } = new();
}

public class AiKeyIssue{
    public string Title { get; set; } = string.Empty;
    public string RootCause { get; set; } = string.Empty;
    public string Solution { get; set; } = string.Empty;
}

public class LogAnalysisResponse{
    public string OverallSummary { get; set; } = string.Empty;
    public List<AiKeyIssue> KeyIssues { get; set; } = new();
}