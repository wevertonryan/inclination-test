namespace InclinationTest.Core.Platform;

public interface ITicker
{
    void Start(Action onTick);

    void Stop();
}
