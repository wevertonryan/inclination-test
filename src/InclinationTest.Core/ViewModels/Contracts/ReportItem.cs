namespace InclinationTest.Core.ViewModels;

/// <summary>Uma gravação salva, já formatada para a lista e para o detalhe dos relatórios.</summary>
public sealed record ReportItem(
    string Id,
    string Title,
    string DateText,
    string DurationText,
    string MetaText,
    string RollText,
    string TrimText);
