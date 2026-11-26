using FluentAssertions;
using InclinationTest.Core.Models;
using InclinationTest.Core.Processing;
using InclinationTest.Core.Tests.TestUtils;
using Xunit;
using Vector3 = InclinationTest.Core.Models.Vector3;

namespace InclinationTest.Core.Tests.Processing;

public class FilterServiceTests
{
    // --- Contrato ---

    [Fact]
    public void Create_ReturnsNonNullFilter()
        => FilterService.Create().Should().NotBeNull();

    [Fact]
    public void Create_ReturnsDistinctInstances()
        => FilterService.Create().Should().NotBeSameAs(FilterService.Create());

    [Fact]
    public void Process_PreservesTimestamp()
    {
        var filter = FilterService.Create();

        var output = filter.Process(MotionFixtures.Sample(MotionFixtures.FlatScreenUp, 1234.5));

        output.Timestamp.Should().Be(1234.5);
    }

    [Fact]
    public void Process_ReturnsFiniteFields()
    {
        var filter = FilterService.Create();

        var output = filter.Process(MotionFixtures.Sample(MotionFixtures.FlatScreenUp));

        double.IsFinite(output.AccelerationIncludingGravity.X).Should().BeTrue();
        double.IsFinite(output.AccelerationIncludingGravity.Y).Should().BeTrue();
        double.IsFinite(output.AccelerationIncludingGravity.Z).Should().BeTrue();
        double.IsFinite(output.RotationRate.X).Should().BeTrue();
        double.IsFinite(output.RotationRate.Y).Should().BeTrue();
        double.IsFinite(output.RotationRate.Z).Should().BeTrue();
    }

    [Fact]
    public void Process_Timestamps_AreNonDecreasing()
    {
        var filter = FilterService.Create();
        var previous = double.NegativeInfinity;

        for (var i = 0; i < 100; i++)
        {
            var output = filter.Process(MotionFixtures.Sample(new Vector3(0, 0, 1), i * 10));

            output.Timestamp.Should().BeGreaterThanOrEqualTo(previous);
            previous = output.Timestamp;
        }
    }

    // --- Invariantes ---

    [Fact]
    public void Process_ConstantInput_ConvergesToConstant()
    {
        var filter = FilterService.Create();
        var output = default(MotionSample);

        for (var i = 0; i < 2000; i++)
        {
            output = filter.Process(MotionFixtures.Sample(new Vector3(0, 0, 1), i));
        }

        output.AccelerationIncludingGravity.Z.Should().BeApproximately(1.0, 0.05);
    }

    [Fact]
    public void Process_AttenuatesNoise()
    {
        var filter = FilterService.Create();
        var rng = new Random(7);
        var input = new List<double>();
        var output = new List<double>();

        for (var i = 0; i < 1000; i++)
        {
            var z = 1.0 + ((rng.NextDouble() - 0.5) * 0.2);
            var filtered = filter.Process(MotionFixtures.Sample(new Vector3(0, 0, z), i));

            if (i >= 100)
            {
                input.Add(z);
                output.Add(filtered.AccelerationIncludingGravity.Z);
            }
        }

        StdDev(output).Should().BeLessThanOrEqualTo(StdDev(input));
    }

    [Fact]
    public void Process_StepResponse_ConvergesToNewValue()
    {
        var filter = FilterService.Create();

        for (var i = 0; i < 500; i++)
        {
            filter.Process(MotionFixtures.Sample(new Vector3(0, 0, 0), i));
        }

        var output = default(MotionSample);
        for (var i = 0; i < 500; i++)
        {
            output = filter.Process(MotionFixtures.Sample(new Vector3(0, 0, 1), i));
        }

        output.AccelerationIncludingGravity.Z.Should().BeApproximately(1.0, 0.1);
    }

    [Fact]
    public void Process_OutputIsBounded()
    {
        var filter = FilterService.Create();
        var rng = new Random(3);

        for (var i = 0; i < 1000; i++)
        {
            var z = 1.0 + ((rng.NextDouble() - 0.5) * 0.4);
            var output = filter.Process(MotionFixtures.Sample(new Vector3(0, 0, z), i));

            Math.Abs(output.AccelerationIncludingGravity.Z).Should().BeLessThanOrEqualTo(2.5);
        }
    }

    [Fact]
    public void Process_NoNaNOrInfinity_ForFiniteInput()
    {
        var filter = FilterService.Create();
        var rng = new Random(11);

        for (var i = 0; i < 1000; i++)
        {
            var value = new Vector3(rng.NextDouble() - 0.5, rng.NextDouble() - 0.5, rng.NextDouble() - 0.5);
            var output = filter.Process(MotionFixtures.Sample(value, i));

            double.IsFinite(output.AccelerationIncludingGravity.X).Should().BeTrue();
            double.IsFinite(output.AccelerationIncludingGravity.Y).Should().BeTrue();
            double.IsFinite(output.AccelerationIncludingGravity.Z).Should().BeTrue();
        }
    }

    [Fact]
    public void Process_IsDeterministic_ForSameSequence()
    {
        var a = FilterService.Create();
        var b = FilterService.Create();
        var rng = new Random(42);

        for (var i = 0; i < 200; i++)
        {
            var value = new Vector3(rng.NextDouble() - 0.5, rng.NextDouble() - 0.5, rng.NextDouble() - 0.5);
            var sample = MotionFixtures.Sample(value, i);

            a.Process(sample).Should().Be(b.Process(sample));
        }
    }

    [Fact]
    public void IndependentInstances_DoNotShareState()
    {
        var zeros = FilterService.Create();
        var ones = FilterService.Create();
        var lastZero = default(MotionSample);
        var lastOne = default(MotionSample);

        for (var i = 0; i < 2000; i++)
        {
            lastZero = zeros.Process(MotionFixtures.Sample(new Vector3(0, 0, 0), i));
            lastOne = ones.Process(MotionFixtures.Sample(new Vector3(0, 0, 1), i));
        }

        lastZero.AccelerationIncludingGravity.Z.Should().BeApproximately(0.0, 0.05);
        lastOne.AccelerationIncludingGravity.Z.Should().BeApproximately(1.0, 0.05);
    }

    [Fact]
    public void Process_RepeatedCalls_AreStable()
    {
        var filter = FilterService.Create();

        for (var i = 0; i < 10000; i++)
        {
            var output = filter.Process(MotionFixtures.Sample(new Vector3(0, 0, 1), i));

            double.IsFinite(output.AccelerationIncludingGravity.Z).Should().BeTrue();
            Math.Abs(output.AccelerationIncludingGravity.Z).Should().BeLessThanOrEqualTo(2.5);
        }
    }

    private static double StdDev(IReadOnlyList<double> values)
    {
        var mean = values.Average();
        var sum = values.Sum(v => (v - mean) * (v - mean));

        return Math.Sqrt(sum / values.Count);
    }
}
