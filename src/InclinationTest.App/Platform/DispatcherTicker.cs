using InclinationTest.Core.Platform;
using Microsoft.Maui.Dispatching;

namespace InclinationTest.App.Platform;

public sealed class DispatcherTicker : ITicker
{
    private readonly IDispatcher _dispatcher;
    private readonly TimeSpan _interval;

    private IDispatcherTimer? _timer;

    public DispatcherTicker(IDispatcher dispatcher, int intervalMs = 100)
    {
        _dispatcher = dispatcher;
        _interval = TimeSpan.FromMilliseconds(intervalMs);
    }

    public void Start(Action onTick)
    {
        Stop();

        var timer = _dispatcher.CreateTimer();
        timer.Interval = _interval;
        timer.IsRepeating = true;
        timer.Tick += (_, _) => onTick();
        timer.Start();

        _timer = timer;
    }

    public void Stop()
    {
        if (_timer is null)
        {
            return;
        }

        _timer.Stop();
        _timer = null;
    }
}
