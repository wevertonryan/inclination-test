using InclinationTest.Core.Sensors;

namespace InclinationTest.Core.Tests.TestUtils.Fakes;

public sealed class FakeAccelerometerSource : IAccelerometerSource
{
    private Action<AccelerometerReading>? _onReading;

    public bool IsAvailable { get; set; } = true;

    public int StartCount { get; private set; }

    public int StopCount { get; private set; }

    public bool IsRunning => _onReading is not null;

    public void Start(Action<AccelerometerReading> onReading)
    {
        _onReading = onReading;
        StartCount++;
    }

    public void Stop()
    {
        _onReading = null;
        StopCount++;
    }

    public void Emit(AccelerometerReading reading) => _onReading?.Invoke(reading);
}
