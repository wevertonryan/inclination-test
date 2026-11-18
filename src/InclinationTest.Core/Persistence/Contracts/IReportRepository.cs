using InclinationTest.Core.Recording;

namespace InclinationTest.Core.Persistence;

public interface IReportRepository
{
    void CreateRecording(string id, double startedAtMs, string? location = null);

    void AppendSamples(string recordingId, IReadOnlyList<RecordedSample> samples);

    void SaveRecording(string recordingId, string title, RecordingSummary summary, double finishedAtMs);

    void DeleteRecording(string recordingId);

    IReadOnlyList<RecordingHeader> ListReports();

    RecordingHeader? GetRecording(string recordingId);

    IReadOnlyList<RecordedSample> GetSamples(string recordingId);

    IReadOnlyList<RecordingHeader> FindInterrupted();
}
