using System.Collections.Concurrent;

namespace InclinationTest.Core.Recording;

public sealed class ThreadSerialExecutor : ISerialExecutor
{
    private readonly BlockingCollection<Action> _queue = new();
    private readonly Thread _worker;

    private bool _completed;
    private bool _disposed;

    public ThreadSerialExecutor()
    {
        _worker = new Thread(Run)
        {
            IsBackground = true,
            Name = "RecordingWriter",
        };
        _worker.Start();
    }

    public void Post(Action work)
    {
        ArgumentNullException.ThrowIfNull(work);

        if (_disposed)
        {
            throw new ObjectDisposedException(nameof(ThreadSerialExecutor));
        }

        _queue.Add(work);
    }

    public void Complete()
    {
        if (_completed)
        {
            return;
        }

        _completed = true;
        _queue.CompleteAdding();
        _worker.Join();
    }

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        _disposed = true;
        Complete();
        _queue.Dispose();
    }

    private void Run()
    {
        foreach (var work in _queue.GetConsumingEnumerable())
        {
            work();
        }
    }
}
