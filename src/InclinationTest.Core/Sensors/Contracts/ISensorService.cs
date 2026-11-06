using InclinationTest.Core.Models;

namespace InclinationTest.Core.Sensors;

public interface ISensorService
{
    bool IsAvailable { get; }

    void Start(Action<MotionSample> onSample);

    void Stop();
}
