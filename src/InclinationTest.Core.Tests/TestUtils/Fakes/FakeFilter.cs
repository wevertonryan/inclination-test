using InclinationTest.Core.Models;
using InclinationTest.Core.Processing;

namespace InclinationTest.Core.Tests.TestUtils.Fakes;

public sealed class FakeFilter : IFilter
{
    private readonly Func<MotionSample, MotionSample> _transform;

    public FakeFilter(Func<MotionSample, MotionSample>? transform = null)
        => _transform = transform ?? (static sample => sample);

    public int ProcessCount { get; private set; }

    public MotionSample Process(MotionSample sample)
    {
        ProcessCount++;
        return _transform(sample);
    }
}
