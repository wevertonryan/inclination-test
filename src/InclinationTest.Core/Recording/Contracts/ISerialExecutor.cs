namespace InclinationTest.Core.Recording;

public interface ISerialExecutor : IDisposable
{
    void Post(Action work);

    void Complete();
}
