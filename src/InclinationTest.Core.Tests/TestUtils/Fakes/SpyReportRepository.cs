using InclinationTest.Core.Persistence;
using InclinationTest.Core.Recording;

namespace InclinationTest.Core.Tests.TestUtils.Fakes;

public sealed class SpyReportRepository : IReportRepository
{
    public List<(string Id, double StartedAtMs, string? Location)> Created { get; } = new();

    public List<(string Id, IReadOnlyList<RecordedSample> Samples)> Appended { get; } = new();

    public List<(string Id, string Title, RecordingSummary Summary, double FinishedAtMs)> Saved { get; } = new();

    public List<string> Deleted { get; } = new();

    public List<string> Calls { get; } = new();

    public void CreateRecording(string id, double startedAtMs, string? location = null)
    {
        Calls.Add("create");
        Created.Add((id, startedAtMs, location));
    }

    public void AppendSamples(string recordingId, IReadOnlyList<RecordedSample> samples)
    {
        Calls.Add("append");
        Appended.Add((recordingId, samples));
    }

    public void SaveRecording(string recordingId, string title, RecordingSummary summary, double finishedAtMs)
    {
        Calls.Add("save");
        Saved.Add((recordingId, title, summary, finishedAtMs));
    }

    public void DeleteRecording(string recordingId)
    {
        Calls.Add("delete");
        Deleted.Add(recordingId);
    }

    public IReadOnlyList<RecordingHeader> ListReports() => Array.Empty<RecordingHeader>();

    public RecordingHeader? GetRecording(string recordingId) => null;

    public IReadOnlyList<RecordedSample> GetSamples(string recordingId) => Array.Empty<RecordedSample>();

    public IReadOnlyList<RecordingHeader> FindInterrupted() => Array.Empty<RecordingHeader>();
}
