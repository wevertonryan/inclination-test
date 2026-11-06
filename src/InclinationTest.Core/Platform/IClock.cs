namespace InclinationTest.Core.Platform;

public interface IClock
{
    long NowMs { get; }
}
