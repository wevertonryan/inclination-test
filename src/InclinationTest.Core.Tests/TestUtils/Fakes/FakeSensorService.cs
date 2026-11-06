using InclinationTest.Core.Models;
using InclinationTest.Core.Sensors;

namespace InclinationTest.Core.Tests.TestUtils.Fakes;

public sealed class FakeSensorService : ISensorService
{
    private Action<MotionSample>? _onSample;

    public bool IsAvailable { get; set; } = true;

    public int StartCount { get; private set; }

    public int StopCount { get; private set; }

    public bool IsRunning => _onSample is not null;

    public void Start(Action<MotionSample> onSample)
    {
        _onSample = onSample;
        StartCount++;
    }

    public void Stop()
    {
        _onSample = null;
        StopCount++;
    }

    public void Emit(MotionSample sample) => _onSample?.Invoke(sample);
}
