using FluentAssertions;
using InclinationTest.Core.Recording;
using Xunit;

namespace InclinationTest.Core.Tests.Recording;

public class StatisticsTests
{
    [Fact]
    public void Empty_CountZero()
    {
        var stats = new Statistics();

        stats.Count.Should().Be(0);
    }

    [Fact]
    public void Empty_MeansZero()
    {
        var stats = new Statistics();

        stats.MeanRoll.Should().Be(0);
        stats.MeanTrim.Should().Be(0);
    }

    [Fact]
    public void Empty_StdZero()
    {
        var stats = new Statistics();

        stats.StdRoll.Should().Be(0);
        stats.StdTrim.Should().Be(0);
    }

    [Fact]
    public void Single_MeanEqualsValue()
    {
        var stats = new Statistics();

        stats.Add(30, 10);

        stats.MeanRoll.Should().BeApproximately(30, 1e-9);
        stats.MeanTrim.Should().BeApproximately(10, 1e-9);
    }

    [Fact]
    public void Single_StdZero()
    {
        var stats = new Statistics();

        stats.Add(30, 10);

        stats.StdRoll.Should().Be(0);
        stats.StdTrim.Should().Be(0);
    }

    [Fact]
    public void Single_MinMaxEqualValue()
    {
        var stats = new Statistics();

        stats.Add(30, 10);

        stats.MinRoll.Should().BeApproximately(30, 1e-9);
        stats.MaxRoll.Should().BeApproximately(30, 1e-9);
        stats.MinTrim.Should().BeApproximately(10, 1e-9);
        stats.MaxTrim.Should().BeApproximately(10, 1e-9);
    }

    [Fact]
    public void Add_IncrementsCount()
    {
        var stats = new Statistics();

        stats.Add(1, 1);
        stats.Add(2, 2);
        stats.Add(3, 3);

        stats.Count.Should().Be(3);
    }

    [Fact]
    public void KnownSet_RollMeanAndPopulationStd()
    {
        var stats = new Statistics();

        foreach (var roll in new[] { 1.0, 2.0, 3.0, 4.0 })
        {
            stats.Add(roll, 0);
        }

        stats.MeanRoll.Should().BeApproximately(2.5, 1e-9);
        stats.StdRoll.Should().BeApproximately(Math.Sqrt(1.25), 1e-9);
    }

    [Fact]
    public void KnownSet_TrimMeanAndPopulationStd()
    {
        var stats = new Statistics();

        foreach (var trim in new[] { 10.0, 20.0, 30.0, 40.0 })
        {
            stats.Add(0, trim);
        }

        stats.MeanTrim.Should().BeApproximately(25, 1e-9);
        stats.StdTrim.Should().BeApproximately(Math.Sqrt(125), 1e-9);
    }

    [Fact]
    public void Channels_TrackedIndependently()
    {
        var stats = new Statistics();

        stats.Add(1, 100);
        stats.Add(3, 200);

        stats.MeanRoll.Should().BeApproximately(2, 1e-9);
        stats.MeanTrim.Should().BeApproximately(150, 1e-9);
    }

    [Fact]
    public void Order_DoesNotAffectResult()
    {
        var forward = new Statistics();
        foreach (var value in new[] { 4.0, 1.0, 3.0, 2.0 })
        {
            forward.Add(value, 0);
        }

        var backward = new Statistics();
        foreach (var value in new[] { 1.0, 2.0, 3.0, 4.0 })
        {
            backward.Add(value, 0);
        }

        forward.MeanRoll.Should().BeApproximately(backward.MeanRoll, 1e-9);
        forward.StdRoll.Should().BeApproximately(backward.StdRoll, 1e-9);
    }

    [Fact]
    public void LargeOffset_StdRemainsStable()
    {
        var stats = new Statistics();

        foreach (var delta in new[] { 0.0, 1.0, 2.0, 3.0 })
        {
            stats.Add(1e9 + delta, 0);
        }

        stats.StdRoll.Should().BeApproximately(Math.Sqrt(1.25), 1e-6);
    }

    [Fact]
    public void MinMax_TracksNegatives()
    {
        var stats = new Statistics();

        stats.Add(-5, 0);
        stats.Add(10, 0);
        stats.Add(-20, 0);

        stats.MinRoll.Should().BeApproximately(-20, 1e-9);
        stats.MaxRoll.Should().BeApproximately(10, 1e-9);
    }

    [Fact]
    public void ToSummary_MapsAllFields()
    {
        var stats = new Statistics();
        foreach (var roll in new[] { 1.0, 2.0, 3.0, 4.0 })
        {
            stats.Add(roll, 0);
        }

        foreach (var trim in new[] { 10.0, 20.0, 30.0, 40.0 })
        {
            stats.Add(0, trim);
        }

        var summary = stats.ToSummary(5000);

        summary.DurationMs.Should().Be(5000);
        summary.SampleCount.Should().Be(8);
        summary.MeanRoll.Should().BeApproximately(2.5, 1e-9);
        summary.StdRoll.Should().BeApproximately(Math.Sqrt(1.25), 1e-9);
        summary.MinRoll.Should().BeApproximately(1, 1e-9);
        summary.MaxRoll.Should().BeApproximately(4, 1e-9);
        summary.RollRange.Should().BeApproximately(3, 1e-9);
        summary.MeanTrim.Should().BeApproximately(25, 1e-9);
        summary.StdTrim.Should().BeApproximately(Math.Sqrt(125), 1e-9);
        summary.MinTrim.Should().BeApproximately(10, 1e-9);
        summary.MaxTrim.Should().BeApproximately(40, 1e-9);
        summary.TrimRange.Should().BeApproximately(30, 1e-9);
    }

    [Fact]
    public void ToSummary_Empty_UsesDurationAndZeroStats()
    {
        var summary = new Statistics().ToSummary(1234);

        summary.DurationMs.Should().Be(1234);
        summary.SampleCount.Should().Be(0);
        summary.MeanRoll.Should().Be(0);
        summary.StdRoll.Should().Be(0);
        summary.RollRange.Should().Be(0);
    }
}
