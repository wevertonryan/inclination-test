using InclinationTest.Core.Platform;

namespace InclinationTest.Core.Tests.TestUtils.Fakes;

public sealed class FakeClock : IClock
{
    public long NowMs { get; set; }
}
