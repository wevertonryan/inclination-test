using InclinationTest.Core.Recording;

namespace InclinationTest.Core.Tests.TestUtils.Fakes;

public sealed class InlineSerialExecutor : ISerialExecutor
{
    public int PostCount { get; private set; }

    public bool Completed { get; private set; }

    public bool Disposed { get; private set; }

    public void Post(Action work)
    {
        PostCount++;
        work();
    }

    public void Complete() => Completed = true;

    public void Dispose() => Disposed = true;
}
