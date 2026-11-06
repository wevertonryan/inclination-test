namespace InclinationTest.Core.Recording;

public readonly record struct RecordingSummary(
    long DurationMs,
    int SampleCount,
    double MeanRoll,
    double StdRoll,
    double MinRoll,
    double MaxRoll,
    double MeanTrim,
    double StdTrim,
    double MinTrim,
    double MaxTrim)
{
    public double RollRange => MaxRoll - MinRoll;

    public double TrimRange => MaxTrim - MinTrim;
}
