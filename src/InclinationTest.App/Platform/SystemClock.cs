using InclinationTest.Core.Platform;

namespace InclinationTest.App.Platform;

public sealed class SystemClock : IClock
{
    public long NowMs => Environment.TickCount64;
}
