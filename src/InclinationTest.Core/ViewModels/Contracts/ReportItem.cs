namespace InclinationTest.Core.ViewModels;

/// <summary>Uma gravação salva, já formatada para a lista e para o detalhe dos relatórios.</summary>
public sealed record ReportItem(
    string Id,
    string Title,
    string DateText,
    string DurationText,
    string MetaText,
    string RollText,
    string TrimText)
{
    public string LocationText { get; init; } = "—";

    public string DateOnlyText { get; init; } = "—";

    public string TimeOnlyText { get; init; } = "—";

    public string DurationLongText { get; init; } = "—";

    public string SampleCountText { get; init; } = "—";

    public string IntervalText { get; init; } = "—";

    public string RollMeanText { get; init; } = "—";

    public string RollStdText { get; init; } = "—";

    public string TrimMeanText { get; init; } = "—";

    public string TrimStdText { get; init; } = "—";

    public string RollMinText { get; init; } = "—";

    public string RollMaxText { get; init; } = "—";

    public string RollRangeText { get; init; } = "—";

    public double RollMinValue { get; init; }

    public double RollMaxValue { get; init; }

    public double RollMeanValue { get; init; }

    public long DurationMs { get; init; }

    public int SampleCount { get; init; }

    public DateTimeOffset? SavedAtUtc { get; init; }
}
