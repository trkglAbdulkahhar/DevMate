namespace DevMate.Api.Models;

public class AnalysisRequest{
    public Differences? Differences { get; set; }
}

public class Differences{
    public List<string> Added { get; set; } = new();
    public List<string> Removed { get; set; } = new();
    public List<ModifiedField> Modified { get; set; } = new(); 
}

public class ModifiedField{
    public string Path{ get; set; } = string.Empty;
    public object? OldValue { get; set; }
    public object? NewValue { get; set; }
}
