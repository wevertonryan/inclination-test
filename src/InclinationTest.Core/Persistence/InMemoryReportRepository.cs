using InclinationTest.Core.Recording;

namespace InclinationTest.Core.Persistence;

public sealed class InMemoryReportRepository : IReportRepository
{
    private readonly Dictionary<string, RecordingHeader> _headers = new();
    private readonly Dictionary<string, SortedDictionary<long, RecordedSample>> _samples = new();

    public void CreateRecording(string id, double startedAtMs, string? location = null)
    {
        if (_headers.ContainsKey(id))
        {
            return;
        }

        _headers[id] = new RecordingHeader(
            id,
            string.Empty,
            startedAtMs,
            null,
            0,
            RecordingStatus.Recording,
            null,
            location)
        {
            StartedAtUtc = DateTimeOffset.UtcNow,
        };
        _samples[id] = new SortedDictionary<long, RecordedSample>();
    }

    public void AppendSamples(string recordingId, IReadOnlyList<RecordedSample> samples)
    {
        if (!_samples.TryGetValue(recordingId, out var target))
        {
            throw new InvalidOperationException($"Recording '{recordingId}' does not exist.");
        }

        foreach (var sample in samples)
        {
            target[sample.ElapsedMs] = sample;
        }
    }

    public void SaveRecording(string recordingId, string title, RecordingSummary summary, double finishedAtMs)
    {
        if (!_headers.TryGetValue(recordingId, out var header))
        {
            throw new InvalidOperationException($"Recording '{recordingId}' does not exist.");
        }

        _headers[recordingId] = header with
        {
            Title = title,
            Status = RecordingStatus.Saved,
            FinishedAtMs = finishedAtMs,
            DurationMs = summary.DurationMs,
            Summary = summary,
            SavedAtUtc = DateTimeOffset.UtcNow,
        };
    }

    public void DeleteRecording(string recordingId)
    {
        _headers.Remove(recordingId);
        _samples.Remove(recordingId);
    }

    public IReadOnlyList<RecordingHeader> ListReports()
        => _headers.Values
            .Where(header => header.Status == RecordingStatus.Saved)
            .OrderByDescending(header => header.StartedAtMs)
            .ToList();

    public RecordingHeader? GetRecording(string recordingId)
        => _headers.TryGetValue(recordingId, out var header) ? header : null;

    public IReadOnlyList<RecordedSample> GetSamples(string recordingId)
        => _samples.TryGetValue(recordingId, out var samples)
            ? samples.Values.ToList()
            : new List<RecordedSample>();

    public IReadOnlyList<RecordingHeader> FindInterrupted()
        => _headers.Values
            .Where(header => header.Status == RecordingStatus.Recording)
            .ToList();
}
