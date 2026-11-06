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
    string? Location)
{
    /// <summary>
    /// Instante de parede em que a gravação começou. <see cref="StartedAtMs"/> vem do relógio
    /// monotônico (<c>Environment.TickCount64</c>) e não serve para exibir data/hora.
    /// </summary>
    public DateTimeOffset? StartedAtUtc { get; init; }

    /// <summary>Instante de parede em que a gravação foi salva.</summary>
    public DateTimeOffset? SavedAtUtc { get; init; }
}
