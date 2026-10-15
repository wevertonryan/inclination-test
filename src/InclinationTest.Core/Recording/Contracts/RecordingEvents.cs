namespace InclinationTest.Core.Recording;

public enum SessionState
{
    Idle,
    Recording,
    Paused,
}

public enum FinishReason
{
    Saved,
    Discarded,
}

public sealed record RecordingStarted(string Id, double TimestampMs);

public sealed record SampleBatch(string Id, IReadOnlyList<RecordedSample> Samples);

public sealed record RecordingFinished(
    string Id,
    FinishReason Reason,
    string? Title,
    RecordingSummary Summary,
    double TimestampMs);
