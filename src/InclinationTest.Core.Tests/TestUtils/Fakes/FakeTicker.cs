using InclinationTest.Core.Platform;

namespace InclinationTest.Core.Tests.TestUtils.Fakes;

public sealed class FakeTicker : ITicker
{
    private Action? _onTick;

    public int StartCount { get; private set; }

    public int StopCount { get; private set; }

    public bool IsRunning => _onTick is not null;

    public void Start(Action onTick)
    {
        _onTick = onTick;
        StartCount++;
    }

    public void Stop()
    {
        _onTick = null;
        StopCount++;
    }

    public void Fire() => _onTick?.Invoke();
}
