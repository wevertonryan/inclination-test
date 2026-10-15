using InclinationTest.Core.Models;

namespace InclinationTest.Core.Recording;

public interface IRecordingSession
{
    SessionState State { get; }

    string? Id { get; }

    long DurationMs { get; }

    int SampleCount { get; }

    event Action<RecordingStarted>? Started;

    event Action<SampleBatch>? BatchReady;

    event Action<RecordingFinished>? Finished;

    void Start(double timestampMs);

    RecordedSample? Append(Angles angles, double timestampMs);

    void Pause(double timestampMs);

    void Resume(double timestampMs);

    RecordingSummary Save(string title);

    void Discard();
}
