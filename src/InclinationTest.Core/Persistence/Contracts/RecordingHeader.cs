using InclinationTest.Core.Recording;

namespace InclinationTest.Core.Persistence;

public sealed record RecordingHeader(
    string Id,
    string Title,
    double StartedAtMs,
    double? FinishedAtMs,
    long DurationMs,
    RecordingStatus Status,
    RecordingSummary? Summary,
    string? Location);
