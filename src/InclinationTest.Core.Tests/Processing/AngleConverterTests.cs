using FluentAssertions;
using InclinationTest.Core.Models;
using InclinationTest.Core.Processing;
using InclinationTest.Core.Tests.TestUtils;
using Xunit;
using Vector3 = InclinationTest.Core.Models.Vector3;

namespace InclinationTest.Core.Tests.Processing;

public class AngleConverterTests
{
    private const double Tol = 1e-6;

    // --- Golden vectors (postura x ângulo) ---

    [Fact]
    public void FlatScreenUp_IsZero()
        => Convert(MotionFixtures.FlatScreenUp).ShouldBeAngles(0, 0, Tol);

    [Fact]
    public void FaceDown_IsRoll180()
        => Convert(MotionFixtures.FaceDown).ShouldBeAngles(180, 0, Tol);

    [Fact]
    public void RightEdgeDown_IsRollPlus90()
        => Convert(MotionFixtures.RightEdgeDown).ShouldBeAngles(90, 0, Tol);

    [Fact]
    public void LeftEdgeDown_IsRollMinus90()
        => Convert(MotionFixtures.LeftEdgeDown).ShouldBeAngles(-90, 0, Tol);

    [Fact]
    public void BowUp_IsTrimPlus90()
        => Convert(MotionFixtures.BowUp).ShouldBeAngles(0, 90, Tol);

    [Fact]
    public void BowDown_IsTrimMinus90()
        => Convert(MotionFixtures.BowDown).ShouldBeAngles(0, -90, Tol);

    [Fact]
    public void RightEdgeDown45_IsRoll45()
        => Convert(MotionFixtures.RightEdgeDown45).ShouldBeAngles(45, 0, Tol);

    [Fact]
    public void BowUp45_IsTrim45()
        => Convert(MotionFixtures.BowUp45).ShouldBeAngles(0, 45, Tol);

    // --- Independência de magnitude (G) ---

    [Fact]
    public void PositiveZScaled_Unchanged()
        => Convert(new Vector3(0, 0, 2)).ShouldBeAngles(0, 0, Tol);

    [Fact]
    public void NegativeZScaled_IsRoll180()
        => Convert(new Vector3(0, 0, -0.5)).ShouldBeAngles(180, 0, Tol);

    [Fact]
    public void ArbitraryScaled_SameAngles()
        => Convert(Scale(MotionFixtures.FromAngles(30, 0), 5)).ShouldBeAngles(30, 0, Tol);

    // --- Vetor nulo ---

    [Fact]
    public void ZeroVector_IsZero()
        => Convert(new Vector3(0, 0, 0)).ShouldBeAngles(0, 0, Tol);

    [Fact]
    public void ZeroVector_IsNotNaN()
    {
        var angles = Convert(new Vector3(0, 0, 0));

        double.IsNaN(angles.Roll).Should().BeFalse();
        double.IsNaN(angles.Trim).Should().BeFalse();
    }

    // --- Sinal ---

    [Fact]
    public void OppositeRolls_OppositeSigns()
    {
        Convert(MotionFixtures.RightEdgeDown).Roll.Should().BeGreaterThan(0);
        Convert(MotionFixtures.LeftEdgeDown).Roll.Should().BeLessThan(0);
    }

    [Fact]
    public void OppositeTrims_OppositeSigns()
    {
        Convert(MotionFixtures.BowUp).Trim.Should().BeGreaterThan(0);
        Convert(MotionFixtures.BowDown).Trim.Should().BeLessThan(0);
    }

    [Fact]
    public void TiltDirection_IsSigned()
    {
        Convert(MotionFixtures.FromAngles(60, 0)).Roll.Should().BeGreaterThan(0);
        Convert(MotionFixtures.FromAngles(-60, 0)).Roll.Should().BeLessThan(0);
    }

    // --- Round-trip ---

    [Theory]
    [InlineData(0, 0)]
    [InlineData(30, 0)]
    [InlineData(0, 30)]
    [InlineData(45, 20)]
    [InlineData(-60, 0)]
    [InlineData(120, 0)]
    [InlineData(0, 85)]
    [InlineData(0, -85)]
    public void RoundTrip_RecoversAngles(double roll, double trim)
        => Convert(MotionFixtures.FromAngles(roll, trim)).ShouldBeAngles(roll, trim, Tol);

    // --- Faixas ---

    [Fact]
    public void Roll_AlwaysWithinRange()
    {
        for (var roll = -180.0; roll <= 180.0; roll += 15)
        {
            for (var trim = -90.0; trim <= 90.0; trim += 15)
            {
                Convert(MotionFixtures.FromAngles(roll, trim)).Roll.Should().BeInRange(-180.0, 180.0);
            }
        }
    }

    [Fact]
    public void Trim_AlwaysWithinRange()
    {
        for (var roll = -180.0; roll <= 180.0; roll += 15)
        {
            for (var trim = -90.0; trim <= 90.0; trim += 15)
            {
                Convert(MotionFixtures.FromAngles(roll, trim)).Trim.Should().BeInRange(-90.0, 90.0);
            }
        }
    }

    [Fact]
    public void FaceDown_IsPositive180_NotNegative()
        => Convert(MotionFixtures.FaceDown).Roll.Should().BeApproximately(180.0, 1e-9);

    // --- Calibração ---

    [Fact]
    public void NullCalibration_EqualsRaw()
    {
        var sample = MotionFixtures.Sample(MotionFixtures.FromAngles(20, 10));

        AngleConverter.ToAngles(sample, null).ShouldBeAngles(20, 10, Tol);
    }

    [Fact]
    public void ZeroCalibration_EqualsRaw()
    {
        var sample = MotionFixtures.Sample(MotionFixtures.FromAngles(20, 10));

        AngleConverter.ToAngles(sample, new Calibration(0, 0)).ShouldBeAngles(20, 10, Tol);
    }

    [Fact]
    public void Calibration_SubtractsOffset()
        => Convert(MotionFixtures.FlatScreenUp, new Calibration(10, 5)).ShouldBeAngles(-10, -5, Tol);

    [Fact]
    public void Calibration_AppliedToTrim()
        => Convert(MotionFixtures.BowUp, new Calibration(0, 15)).ShouldBeAngles(0, 75, Tol);

    [Fact]
    public void Calibration_AtCurrentReading_Zeroes()
    {
        var reading = MotionFixtures.FromAngles(20, 10);

        Convert(reading, new Calibration(20, 10)).ShouldBeAngles(0, 0, Tol);
    }

    [Fact]
    public void Calibration_RewrapsRoll()
    {
        // bruto 170°, offset -20° -> 190° -> -170°
        Convert(MotionFixtures.FromAngles(170, 0), new Calibration(-20, 0)).ShouldBeAngles(-170, 0, Tol);
    }

    // --- Fuzz ---

    [Fact]
    public void Fuzz_RollAlwaysInRange()
    {
        var rng = new Random(12345);

        for (var i = 0; i < 5000; i++)
        {
            AngleConverter.ToAngles(MotionFixtures.Sample(RandomUnit(rng))).Roll.Should().BeInRange(-180.0, 180.0);
        }
    }

    [Fact]
    public void Fuzz_TrimAlwaysInRange()
    {
        var rng = new Random(12345);

        for (var i = 0; i < 5000; i++)
        {
            AngleConverter.ToAngles(MotionFixtures.Sample(RandomUnit(rng))).Trim.Should().BeInRange(-90.0, 90.0);
        }
    }

    [Fact]
    public void Fuzz_OutputIsFinite()
    {
        var rng = new Random(999);

        for (var i = 0; i < 5000; i++)
        {
            var angles = AngleConverter.ToAngles(MotionFixtures.Sample(RandomUnit(rng)));

            double.IsFinite(angles.Roll).Should().BeTrue();
            double.IsFinite(angles.Trim).Should().BeTrue();
        }
    }

    // --- Pureza ---

    [Fact]
    public void SameInput_ProducesSameOutput()
    {
        var sample = MotionFixtures.Sample(MotionFixtures.FromAngles(33, -12));

        AngleConverter.ToAngles(sample).Should().Be(AngleConverter.ToAngles(sample));
    }

    private static Angles Convert(Vector3 acceleration)
        => AngleConverter.ToAngles(MotionFixtures.Sample(acceleration));

    private static Angles Convert(Vector3 acceleration, Calibration calibration)
        => AngleConverter.ToAngles(MotionFixtures.Sample(acceleration), calibration);

    private static Vector3 Scale(Vector3 value, double factor)
        => new(value.X * factor, value.Y * factor, value.Z * factor);

    private static Vector3 RandomUnit(Random rng)
    {
        var x = (rng.NextDouble() * 2) - 1;
        var y = (rng.NextDouble() * 2) - 1;
        var z = (rng.NextDouble() * 2) - 1;
        var norm = Math.Sqrt((x * x) + (y * y) + (z * z));

        return norm < 1e-6 ? new Vector3(0, 0, 1) : new Vector3(x / norm, y / norm, z / norm);
    }
}
