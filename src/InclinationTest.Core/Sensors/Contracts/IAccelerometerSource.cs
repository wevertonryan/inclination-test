namespace InclinationTest.Core.Sensors;

public interface IAccelerometerSource
{
    bool IsAvailable { get; }

    void Start(Action<AccelerometerReading> onReading);

    void Stop();
}
