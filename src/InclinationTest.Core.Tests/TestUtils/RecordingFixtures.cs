using InclinationTest.Core.Models;
using InclinationTest.Core.Recording;

namespace InclinationTest.Core.Tests.TestUtils;

public static class RecordingFixtures
{
    public static Angles Angle(double roll, double trim) => new(roll, trim);

    public static RecordedSample Sample(long elapsedMs, double roll, double trim)
        => new(elapsedMs, roll, trim);
}
