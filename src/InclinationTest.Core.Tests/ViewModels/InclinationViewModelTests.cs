using FluentAssertions;
using InclinationTest.Core.Models;
using InclinationTest.Core.Processing;
using InclinationTest.Core.Tests.TestUtils;
using InclinationTest.Core.Tests.TestUtils.Fakes;
using InclinationTest.Core.ViewModels;
using Xunit;

namespace InclinationTest.Core.Tests.ViewModels;

public class InclinationViewModelTests
{
    // --- Estado inicial ---

    [Fact]
    public void Initial_IsRunningFalse()
    {
        var (vm, _, _) = Create();

        vm.IsRunning.Should().BeFalse();
    }

    [Fact]
    public void Initial_IsCalibratedFalse()
    {
        var (vm, _, _) = Create();

        vm.IsCalibrated.Should().BeFalse();
    }

    [Fact]
    public void Initial_Roll_Zero()
    {
        var (vm, _, _) = Create();

        vm.Roll.Should().Be(0);
    }

    [Fact]
    public void Initial_Trim_Zero()
    {
        var (vm, _, _) = Create();

        vm.Trim.Should().Be(0);
    }

    [Fact]
    public void Initial_Error_Null()
    {
        var (vm, _, _) = Create();

        vm.Error.Should().BeNull();
    }

    // --- Start / Stop ---

    [Fact]
    public void Start_SetsIsRunningTrue()
    {
        var (vm, _, _) = Create();

        vm.Start();

        vm.IsRunning.Should().BeTrue();
    }

    [Fact]
    public void Start_StartsSensor()
    {
        var (vm, sensor, _) = Create();

        vm.Start();

        sensor.StartCount.Should().Be(1);
    }

    [Fact]
    public void Start_Twice_SingleSensorStart()
    {
        var (vm, sensor, _) = Create();

        vm.Start();
        vm.Start();

        sensor.StartCount.Should().Be(1);
    }

    [Fact]
    public void Stop_SetsIsRunningFalse()
    {
        var (vm, _, _) = Create();
        vm.Start();

        vm.Stop();

        vm.IsRunning.Should().BeFalse();
    }

    [Fact]
    public void Stop_StopsSensor()
    {
        var (vm, sensor, _) = Create();
        vm.Start();

        vm.Stop();

        sensor.StopCount.Should().Be(1);
    }

    [Fact]
    public void Start_ThenStop_CanStartAgain()
    {
        var (vm, sensor, _) = Create();
        vm.Start();
        vm.Stop();

        vm.Start();

        vm.IsRunning.Should().BeTrue();
        sensor.StartCount.Should().Be(2);
    }

    // --- OnSample ---

    [Fact]
    public void OnSample_NotCalled_BeforeStart()
    {
        var (vm, sensor, _) = Create();
        var count = 0;
        vm.OnSample += (_, _) => count++;

        sensor.Emit(MotionFixtures.Sample(MotionFixtures.FlatScreenUp, 1));

        count.Should().Be(0);
    }

    [Fact]
    public void OnSample_CalledPerSample()
    {
        var (vm, sensor, _) = Create();
        var count = 0;
        vm.OnSample += (_, _) => count++;
        vm.Start();

        sensor.Emit(MotionFixtures.Sample(MotionFixtures.FlatScreenUp, 1));
        sensor.Emit(MotionFixtures.Sample(MotionFixtures.FlatScreenUp, 2));

        count.Should().Be(2);
    }

    [Fact]
    public void OnSample_ForwardsTimestamp()
    {
        var (vm, sensor, _) = Create();
        var timestamp = -1.0;
        vm.OnSample += (_, t) => timestamp = t;
        vm.Start();

        sensor.Emit(MotionFixtures.Sample(MotionFixtures.FlatScreenUp, 4242));

        timestamp.Should().Be(4242);
    }

    [Fact]
    public void OnSample_AnglesMatchState()
    {
        var (vm, sensor, _) = Create();
        var emitted = default(Angles);
        vm.OnSample += (angles, _) => emitted = angles;
        vm.Start();

        sensor.Emit(MotionFixtures.Sample(MotionFixtures.FromAngles(30, 10), 1));

        emitted.Roll.Should().BeApproximately(vm.Roll, 1e-9);
        emitted.Trim.Should().BeApproximately(vm.Trim, 1e-9);
    }

    [Fact]
    public void Stop_StopsForwardingOnSample()
    {
        var (vm, sensor, _) = Create();
        var count = 0;
        vm.OnSample += (_, _) => count++;
        vm.Start();
        sensor.Emit(MotionFixtures.Sample(MotionFixtures.FlatScreenUp, 1));

        vm.Stop();
        sensor.Emit(MotionFixtures.Sample(MotionFixtures.FlatScreenUp, 2));

        count.Should().Be(1);
    }

    // --- Estado dos ângulos ---

    [Fact]
    public void Roll_UpdatesFromSample()
    {
        var (vm, sensor, _) = Create();
        vm.Start();

        sensor.Emit(MotionFixtures.Sample(MotionFixtures.FromAngles(30, 0), 1));

        vm.Roll.Should().BeApproximately(30, 1e-6);
    }

    [Fact]
    public void Trim_UpdatesFromSample()
    {
        var (vm, sensor, _) = Create();
        vm.Start();

        sensor.Emit(MotionFixtures.Sample(MotionFixtures.FromAngles(0, 25), 1));

        vm.Trim.Should().BeApproximately(25, 1e-6);
    }

    [Fact]
    public void State_MatchesAngleConverter()
    {
        var (vm, sensor, _) = Create();
        vm.Start();
        var sample = MotionFixtures.Sample(MotionFixtures.FromAngles(-42, 17), 5);

        sensor.Emit(sample);

        var expected = AngleConverter.ToAngles(sample);
        vm.Roll.Should().BeApproximately(expected.Roll, 1e-9);
        vm.Trim.Should().BeApproximately(expected.Trim, 1e-9);
    }

    [Fact]
    public void Pipeline_UsesFilteredSample()
    {
        var (vm, sensor, _) = Create(
            sample => MotionFixtures.Sample(MotionFixtures.FromAngles(50, 0), sample.Timestamp));
        vm.Start();

        sensor.Emit(MotionFixtures.Sample(MotionFixtures.FlatScreenUp, 1));

        vm.Roll.Should().BeApproximately(50, 1e-6);
    }

    // --- Calibração ---

    [Fact]
    public void Calibrate_SetsIsCalibratedTrue()
    {
        var (vm, _, _) = Create();
        vm.Start();

        vm.Calibrate();

        vm.IsCalibrated.Should().BeTrue();
    }

    [Fact]
    public void Calibrate_BeforeSample_DoesNotThrow()
    {
        var (vm, _, _) = Create();
        vm.Start();

        var act = () => vm.Calibrate();

        act.Should().NotThrow();
    }

    [Fact]
    public void Calibrate_ZeroesCurrentReading()
    {
        var (vm, sensor, _) = Create();
        vm.Start();
        sensor.Emit(MotionFixtures.Sample(MotionFixtures.FromAngles(20, 10), 1));

        vm.Calibrate();
        sensor.Emit(MotionFixtures.Sample(MotionFixtures.FromAngles(20, 10), 2));

        vm.Roll.Should().BeApproximately(0, 1e-6);
        vm.Trim.Should().BeApproximately(0, 1e-6);
    }

    [Fact]
    public void Calibrate_UsesLatestReading()
    {
        var (vm, sensor, _) = Create();
        vm.Start();
        sensor.Emit(MotionFixtures.Sample(MotionFixtures.FromAngles(10, 0), 1));
        sensor.Emit(MotionFixtures.Sample(MotionFixtures.FromAngles(40, 0), 2));

        vm.Calibrate();
        sensor.Emit(MotionFixtures.Sample(MotionFixtures.FromAngles(40, 0), 3));

        vm.Roll.Should().BeApproximately(0, 1e-6);
    }

    [Fact]
    public void Calibrate_SecondTime_ZeroesCurrentReading()
    {
        var (vm, sensor, _) = Create();
        vm.Start();
        sensor.Emit(MotionFixtures.Sample(MotionFixtures.FromAngles(20, 10), 1));

        vm.Calibrate();
        sensor.Emit(MotionFixtures.Sample(MotionFixtures.FromAngles(30, 5), 2));

        vm.Calibrate();
        sensor.Emit(MotionFixtures.Sample(MotionFixtures.FromAngles(30, 5), 3));

        vm.Roll.Should().BeApproximately(0, 1e-6);
        vm.Trim.Should().BeApproximately(0, 1e-6);
    }

    [Fact]
    public void Calibrate_SecondTime_SubsequentSamplesRelativeToNewZero()
    {
        var (vm, sensor, _) = Create();
        vm.Start();
        sensor.Emit(MotionFixtures.Sample(MotionFixtures.FromAngles(20, 0), 1));

        vm.Calibrate();
        sensor.Emit(MotionFixtures.Sample(MotionFixtures.FromAngles(30, 0), 2));

        vm.Calibrate();
        sensor.Emit(MotionFixtures.Sample(MotionFixtures.FromAngles(35, 0), 3));

        vm.Roll.Should().BeApproximately(5, 1e-6);
    }

    private static (InclinationViewModel ViewModel, FakeSensorService Sensor, FakeFilter Filter) Create(
        Func<MotionSample, MotionSample>? filterTransform = null)
    {
        var sensor = new FakeSensorService();
        var filter = new FakeFilter(filterTransform);

        return (new InclinationViewModel(sensor, filter), sensor, filter);
    }
}
