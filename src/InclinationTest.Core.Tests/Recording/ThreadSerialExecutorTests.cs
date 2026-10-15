using FluentAssertions;
using InclinationTest.Core.Recording;
using Xunit;

namespace InclinationTest.Core.Tests.Recording;

public class ThreadSerialExecutorTests
{
    [Fact]
    public void Post_ExecutesWork()
    {
        using var executor = new ThreadSerialExecutor();
        var done = new ManualResetEventSlim();

        executor.Post(done.Set);

        done.Wait(TimeSpan.FromSeconds(2)).Should().BeTrue();
    }

    [Fact]
    public void Post_PreservesOrder()
    {
        using var executor = new ThreadSerialExecutor();
        var values = new List<int>();
        var done = new ManualResetEventSlim();

        for (var i = 0; i < 5; i++)
        {
            var value = i;
            executor.Post(() =>
            {
                values.Add(value);
                if (value == 4)
                {
                    done.Set();
                }
            });
        }

        done.Wait(TimeSpan.FromSeconds(2)).Should().BeTrue();
        values.Should().Equal(0, 1, 2, 3, 4);
    }

    [Fact]
    public void Complete_DrainsPendingWork()
    {
        using var executor = new ThreadSerialExecutor();
        var count = 0;
        executor.Post(() => Interlocked.Increment(ref count));

        executor.Complete();

        count.Should().Be(1);
    }

    [Fact]
    public void Post_AfterDispose_Throws()
    {
        var executor = new ThreadSerialExecutor();
        executor.Dispose();

        var act = () => executor.Post(() => { });

        act.Should().Throw<ObjectDisposedException>();
    }
}
