using FluentAssertions;
using InclinationTest.Core.Models;

namespace InclinationTest.Core.Tests.TestUtils;

public static class AngleAssertions
{
    public const double DefaultTolerance = 1e-6;

    public static void ShouldBeAngles(
        this Angles actual,
        double roll,
        double trim,
        double tolerance = DefaultTolerance)
    {
        actual.Roll.Should().BeApproximately(Wrap180(roll), tolerance, "roll");
        actual.Trim.Should().BeApproximately(trim, tolerance, "trim");
    }

    public static double Wrap180(double degrees)
    {
        var value = degrees % 360.0;
        if (value <= -180.0)
        {
            value += 360.0;
        }

        if (value > 180.0)
        {
            value -= 360.0;
        }

        return value;
    }
}
