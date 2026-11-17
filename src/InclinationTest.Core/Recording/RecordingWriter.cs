using InclinationTest.Core.Persistence;
using InclinationTest.Core.Services;

namespace InclinationTest.Core.Recording;

public sealed class RecordingWriter : IDisposable
{
    private readonly IRecordingSession _session;
    private readonly IReportRepository _repository;
    private readonly ISerialExecutor _executor;
    private readonly ICloudSyncService? _cloudSync;

    private bool _finished;
    private bool _disposed;

    public RecordingWriter(
        IRecordingSession session,
        IReportRepository repository,
        ISerialExecutor executor,
        ICloudSyncService? cloudSync = null)
    {
        _session = session;
        _repository = repository;
        _executor = executor;
        _cloudSync = cloudSync;

        _session.Started += OnStarted;
        _session.BatchReady += OnBatchReady;
        _session.Finished += OnFinished;
    }

    /// <summary>
    /// Disparado (na thread do executor) depois que um relatório foi salvo no repositório.
    /// A tela de Relatórios usa isso para se atualizar sem polling.
    /// </summary>
    public event Action<string>? Saved;

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        _disposed = true;
        Unsubscribe();
        _executor.Complete();
    }

    private void OnStarted(RecordingStarted started)
    {
        _finished = false;

        _executor.Post(() => _repository.CreateRecording(started.Id, started.TimestampMs));
    }

    private void OnBatchReady(SampleBatch batch)
    {
        if (_finished)
        {
            return;
        }

        _executor.Post(() => _repository.AppendSamples(batch.Id, batch.Samples));
    }

    private void OnFinished(RecordingFinished finished)
    {
        if (_finished)
        {
            return;
        }

        _finished = true;

        var id = finished.Id;

        if (finished.Reason == FinishReason.Saved)
        {
            _executor.Post(() =>
            {
                _repository.SaveRecording(id, finished.Title ?? string.Empty, finished.Summary, finished.TimestampMs);
                Saved?.Invoke(id);

                if (_cloudSync != null && _cloudSync.AutoSyncEnabled)
                {
                    try
                    {
                        var samples = _repository.ReadSamples(id);
                        _ = _cloudSync.SyncRecordingAsync(id, finished.Title ?? string.Empty, finished.Summary, samples);
                    }
                    catch (Exception ex)
                    {
                        System.Diagnostics.Debug.WriteLine($"[RecordingWriter] Cloud sync failed: {ex}");
                    }
                }
            });
        }
        else
        {
            _executor.Post(() => _repository.DeleteRecording(id));
        }
    }

    private void Unsubscribe()
    {
        _session.Started -= OnStarted;
        _session.BatchReady -= OnBatchReady;
        _session.Finished -= OnFinished;
    }
}
