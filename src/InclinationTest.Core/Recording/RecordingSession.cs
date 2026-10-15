using InclinationTest.Core.Models;

namespace InclinationTest.Core.Recording;

public sealed class RecordingSession : IRecordingSession
{
    public const int DefaultSampleIntervalMs = 83;

    public const int DefaultFlushIntervalMs = 2000;

    private readonly List<RecordedSample> _buffer = new();

    private Statistics _statistics = new();
    private string? _id;
    private SessionState _state = SessionState.Idle;
    private long _elapsedMs;
    private long _accumulatedMs;
    private double _segmentStartMs;
    private long _lastAcceptedElapsedMs;
    private bool _hasAccepted;
    private long _lastFlushElapsedMs;

    public RecordingSession(RecordingOptions? options = null)
        => Options = options ?? RecordingOptions.Default;

    public RecordingOptions Options { get; }

    public SessionState State => _state;

    public string? Id => _id;

    public long DurationMs => _elapsedMs;

    public int SampleCount => _statistics.Count;

    public event Action<RecordingStarted>? Started;

    public event Action<SampleBatch>? BatchReady;

    public event Action<RecordingFinished>? Finished;

    public void Start(double timestampMs)
    {
        if (_state != SessionState.Idle)
        {
            return;
        }

        _id = Guid.NewGuid().ToString("N");
        _statistics = new Statistics();
        _buffer.Clear();
        _state = SessionState.Recording;
        _elapsedMs = 0;
        _accumulatedMs = 0;
        _segmentStartMs = timestampMs;
        _lastAcceptedElapsedMs = 0;
        _hasAccepted = false;
        _lastFlushElapsedMs = 0;

        Started?.Invoke(new RecordingStarted(_id, timestampMs));
    }

    public RecordedSample? Append(Angles angles, double timestampMs)
    {
        if (_state != SessionState.Recording)
        {
            return null;
        }

        var elapsed = _accumulatedMs + (long)(timestampMs - _segmentStartMs);

        if (_hasAccepted && elapsed - _lastAcceptedElapsedMs < Options.SampleIntervalMs)
        {
            return null;
        }

        var sample = new RecordedSample(elapsed, angles.Roll, angles.Trim);

        _hasAccepted = true;
        _lastAcceptedElapsedMs = elapsed;
        _elapsedMs = elapsed;
        _statistics.Add(angles.Roll, angles.Trim);
        _buffer.Add(sample);

        if (elapsed - _lastFlushElapsedMs >= Options.FlushIntervalMs)
        {
            Flush(elapsed);
        }

        return sample;
    }

    public void Pause(double timestampMs)
    {
        if (_state != SessionState.Recording)
        {
            return;
        }

        _accumulatedMs += (long)(timestampMs - _segmentStartMs);
        _state = SessionState.Paused;
    }

    public void Resume(double timestampMs)
    {
        if (_state != SessionState.Paused)
        {
            return;
        }

        _segmentStartMs = timestampMs;
        _state = SessionState.Recording;
    }

    public RecordingSummary Save(string title)
    {
        var summary = _statistics.ToSummary(_elapsedMs);

        Flush(_elapsedMs);
        _state = SessionState.Idle;

        Finished?.Invoke(new RecordingFinished(_id ?? string.Empty, FinishReason.Saved, title, summary, _elapsedMs));

        return summary;
    }

    public void Discard()
    {
        var summary = _statistics.ToSummary(_elapsedMs);

        _buffer.Clear();
        _state = SessionState.Idle;

        Finished?.Invoke(new RecordingFinished(_id ?? string.Empty, FinishReason.Discarded, null, summary, _elapsedMs));
    }

    private void Flush(long elapsedMs)
    {
        if (_buffer.Count == 0)
        {
            return;
        }

        var batch = new SampleBatch(_id ?? string.Empty, _buffer.ToArray());
        _buffer.Clear();
        _lastFlushElapsedMs = elapsedMs;
        BatchReady?.Invoke(batch);
    }
}
