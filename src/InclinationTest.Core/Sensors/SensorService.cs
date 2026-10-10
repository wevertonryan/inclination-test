using InclinationTest.Core.Models;

namespace InclinationTest.Core.Sensors;

public sealed class SensorService : ISensorService
{
    private readonly IAccelerometerSource _source;

    private Action<MotionSample>? _onSample;
    private bool _running;

    public SensorService(IAccelerometerSource source) => _source = source;

    public bool IsAvailable => _source.IsAvailable;

    public void Start(Action<MotionSample> onSample)
    {
        if (_running)
        {
            return;
        }

        _onSample = onSample;
        _running = true;
        _source.Start(HandleReading);
    }

    public void Stop()
    {
        if (!_running)
        {
            return;
        }

        _running = false;
        _onSample = null;
        _source.Stop();
    }

    private void HandleReading(AccelerometerReading reading)
    {
        var onSample = _onSample;
        if (onSample is null)
        {
            return;
        }

        onSample(new MotionSample(reading.Acceleration, reading.RotationRate, reading.Rotation, reading.Timestamp));
    }
}
