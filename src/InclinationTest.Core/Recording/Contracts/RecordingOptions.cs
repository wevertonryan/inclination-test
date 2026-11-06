namespace InclinationTest.Core.Recording;

public sealed record RecordingOptions
{
    public static RecordingOptions Default { get; } = new();

    public int SampleIntervalMs { get; init; } = RecordingSession.DefaultSampleIntervalMs;

    public int FlushIntervalMs { get; init; } = RecordingSession.DefaultFlushIntervalMs;
}
