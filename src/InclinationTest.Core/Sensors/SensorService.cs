using InclinationTest.Core.Models;

namespace InclinationTest.Core.Sensors;

public sealed class SensorService : ISensorService
{
    public SensorService(IAccelerometerSource source) => throw new NotImplementedException();

    public bool IsAvailable => throw new NotImplementedException();

    public void Start(Action<MotionSample> onSample) => throw new NotImplementedException();

    public void Stop() => throw new NotImplementedException();
}
