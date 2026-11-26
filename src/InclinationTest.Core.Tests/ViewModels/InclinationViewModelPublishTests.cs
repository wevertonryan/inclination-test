using FluentAssertions;
using InclinationTest.Core.Tests.TestUtils;
using InclinationTest.Core.Tests.TestUtils.Fakes;
using InclinationTest.Core.ViewModels;
using Xunit;

namespace InclinationTest.Core.Tests.ViewModels;

public class InclinationViewModelPublishTests
{
    [Fact]
    public void Throttle_ForwardsEverySampleToOnSample()
    {
        var sensor = new FakeSensorService();
        var viewModel = new InclinationViewModel(sensor, new FakeFilter(), uiIntervalMs: 100);
        var forwarded = 0;
        viewModel.OnSample += (_, _) => forwarded++;
        viewModel.Start();

        sensor.Emit(MotionFixtures.Sample(MotionFixtures.FromAngles(10, 0), 1000));
        sensor.Emit(MotionFixtures.Sample(MotionFixtures.FromAngles(30, 0), 1030));
        sensor.Emit(MotionFixtures.Sample(MotionFixtures.FromAngles(50, 0), 1100));

        forwarded.Should().Be(3);
    }

    [Fact]
    public void Throttle_HoldsUiValueUntilIntervalElapses()
    {
        var sensor = new FakeSensorService();
        var viewModel = new InclinationViewModel(sensor, new FakeFilter(), uiIntervalMs: 100);
        viewModel.Start();

        sensor.Emit(MotionFixtures.Sample(MotionFixtures.FromAngles(10, 0), 1000));
        viewModel.Roll.Should().BeApproximately(10, 1e-6);

        sensor.Emit(MotionFixtures.Sample(MotionFixtures.FromAngles(30, 0), 1030));
        viewModel.Roll.Should().BeApproximately(10, 1e-6);

        sensor.Emit(MotionFixtures.Sample(MotionFixtures.FromAngles(50, 0), 1100));
        viewModel.Roll.Should().BeApproximately(50, 1e-6);
    }

    [Fact]
    public void Throttle_Zero_PublishesEverySample()
    {
        var sensor = new FakeSensorService();
        var viewModel = new InclinationViewModel(sensor, new FakeFilter());
        viewModel.Start();

        sensor.Emit(MotionFixtures.Sample(MotionFixtures.FromAngles(10, 0), 1000));
        sensor.Emit(MotionFixtures.Sample(MotionFixtures.FromAngles(30, 0), 1030));

        viewModel.Roll.Should().BeApproximately(30, 1e-6);
    }
}
