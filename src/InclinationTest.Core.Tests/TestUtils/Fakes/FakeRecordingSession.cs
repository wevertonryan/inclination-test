using InclinationTest.Core.Models;
using InclinationTest.Core.Recording;

namespace InclinationTest.Core.Tests.TestUtils.Fakes;

public sealed class FakeRecordingSession : IRecordingSession
{
    public SessionState State { get; private set; } = SessionState.Idle;

    public string? Id { get; private set; }

    public long DurationMs { get; private set; }

    public int SampleCount { get; private set; }

    public int StartCount { get; private set; }

    public int PauseCount { get; private set; }

    public int ResumeCount { get; private set; }

    public int SaveCount { get; private set; }

    public int DiscardCount { get; private set; }

    public string? LastTitle { get; private set; }

    public List<(Angles Angles, double TimestampMs)> Appended { get; } = new();

    public bool AcceptSamples { get; set; } = true;

    public event Action<RecordingStarted>? Started;

    public event Action<SampleBatch>? BatchReady;

    public event Action<RecordingFinished>? Finished;

    public void Start(double timestampMs)
    {
        StartCount++;
        Id = $"rec-{StartCount}";
        State = SessionState.Recording;
        Started?.Invoke(new RecordingStarted(Id, timestampMs));
    }

    public RecordedSample? Append(Angles angles, double timestampMs)
    {
        if (State != SessionState.Recording)
        {
            return null;
        }

        Appended.Add((angles, timestampMs));

        if (!AcceptSamples)
        {
            return null;
        }

        SampleCount++;
        return new RecordedSample((long)timestampMs, angles.Roll, angles.Trim);
    }

    public void Pause(double timestampMs)
    {
        PauseCount++;
        State = SessionState.Paused;
    }

    public void Resume(double timestampMs)
    {
        ResumeCount++;
        State = SessionState.Recording;
    }

    public RecordingSummary Save(string title)
    {
        SaveCount++;
        LastTitle = title;
        var summary = new RecordingSummary(DurationMs, SampleCount, 0, 0, 0, 0, 0, 0, 0, 0);
        var id = Id ?? "rec";
        State = SessionState.Idle;
        Finished?.Invoke(new RecordingFinished(id, FinishReason.Saved, title, summary, 0));
        return summary;
    }

    public void Discard()
    {
        DiscardCount++;
        var id = Id ?? "rec";
        State = SessionState.Idle;
        Finished?.Invoke(new RecordingFinished(id, FinishReason.Discarded, null, default, 0));
    }

    public void EmitBatch(params RecordedSample[] samples)
        => BatchReady?.Invoke(new SampleBatch(Id ?? "rec", samples));
}
