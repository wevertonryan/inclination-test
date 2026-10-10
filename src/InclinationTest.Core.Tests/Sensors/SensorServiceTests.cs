using FluentAssertions;
using InclinationTest.Core.Models;
using InclinationTest.Core.Sensors;
using InclinationTest.Core.Tests.TestUtils.Fakes;
using Xunit;
using Quaternion = System.Numerics.Quaternion;
using Vector3 = InclinationTest.Core.Models.Vector3;

namespace InclinationTest.Core.Tests.Sensors;

public class SensorServiceTests
{
    // --- Disponibilidade ---

    [Fact]
    public void IsAvailable_True_WhenSourceAvailable()
    {
        var source = new FakeAccelerometerSource { IsAvailable = true };

        new SensorService(source).IsAvailable.Should().BeTrue();
    }

    [Fact]
    public void IsAvailable_False_WhenSourceUnavailable()
    {
        var source = new FakeAccelerometerSource { IsAvailable = false };

        new SensorService(source).IsAvailable.Should().BeFalse();
    }

    [Fact]
    public void IsAvailable_MirrorsSource_AfterConstruction()
    {
        var source = new FakeAccelerometerSource { IsAvailable = true };
        var service = new SensorService(source);

        source.IsAvailable = false;

        service.IsAvailable.Should().BeFalse();
    }

    // --- Ciclo de vida ---

    [Fact]
    public void Start_MarksSourceRunning()
    {
        var (service, source) = Create();

        service.Start(_ => { });

        source.IsRunning.Should().BeTrue();
    }

    [Fact]
    public void Start_IncreasesSourceStartCountByOne()
    {
        var (service, source) = Create();

        service.Start(_ => { });

        source.StartCount.Should().Be(1);
    }

    [Fact]
    public void Start_Twice_DoesNotDuplicateSubscription()
    {
        var (service, source) = Create();

        service.Start(_ => { });
        service.Start(_ => { });

        source.StartCount.Should().Be(1);
    }

    [Fact]
    public void Stop_MarksSourceStopped()
    {
        var (service, source) = Create();
        service.Start(_ => { });

        service.Stop();

        source.IsRunning.Should().BeFalse();
    }

    [Fact]
    public void Stop_IncreasesSourceStopCountByOne()
    {
        var (service, source) = Create();
        service.Start(_ => { });

        service.Stop();

        source.StopCount.Should().Be(1);
    }

    [Fact]
    public void Stop_WithoutStart_DoesNotThrow()
    {
        var (service, _) = Create();

        var act = () => service.Stop();

        act.Should().NotThrow();
    }

    [Fact]
    public void Start_AfterStop_ForwardsAgain()
    {
        var (service, source) = Create();
        service.Start(_ => { });
        service.Stop();
        var count = 0;

        service.Start(_ => count++);
        source.Emit(Reading());

        count.Should().Be(1);
    }

    // --- Encaminhamento ---

    [Fact]
    public void Start_ForwardsEachReading_AsOneSample()
    {
        var (service, source) = Create();
        var count = 0;
        service.Start(_ => count++);

        source.Emit(Reading());
        source.Emit(Reading());

        count.Should().Be(2);
    }

    [Fact]
    public void Stop_StopsForwarding()
    {
        var (service, source) = Create();
        var count = 0;
        service.Start(_ => count++);
        source.Emit(Reading());

        service.Stop();
        source.Emit(Reading());

        count.Should().Be(1);
    }

    [Fact]
    public void MultipleReadings_ProduceMultipleSamples_InOrder()
    {
        var (service, source) = Create();
        var timestamps = new List<double>();
        service.Start(s => timestamps.Add(s.Timestamp));

        source.Emit(Reading(timestamp: 1));
        source.Emit(Reading(timestamp: 2));
        source.Emit(Reading(timestamp: 3));

        timestamps.Should().Equal(1, 2, 3);
    }

    [Fact]
    public void Samples_TimestampsNonDecreasing_ForMonotonicReadings()
    {
        var (service, source) = Create();
        var timestamps = new List<double>();
        service.Start(s => timestamps.Add(s.Timestamp));

        for (var i = 0; i < 50; i++)
        {
            source.Emit(Reading(timestamp: i * 10));
        }

        timestamps.Should().BeInAscendingOrder();
    }

    // --- Conversão de forma ---

    [Fact]
    public void Mapping_AccelerationIncludingGravity()
    {
        var (service, source) = Create();
        var (received, sample) = Capture(service);

        source.Emit(Reading(acceleration: new Vector3(0.1, 0.2, 0.3)));

        received().Should().BeTrue();
        sample().AccelerationIncludingGravity.Should().Be(new Vector3(0.1, 0.2, 0.3));
    }

    [Fact]
    public void Mapping_RotationRate()
    {
        var (service, source) = Create();
        var (received, sample) = Capture(service);

        source.Emit(Reading(rotationRate: new Vector3(1, 2, 3)));

        received().Should().BeTrue();
        sample().RotationRate.Should().Be(new Vector3(1, 2, 3));
    }

    [Fact]
    public void Mapping_Rotation()
    {
        var (service, source) = Create();
        var (received, sample) = Capture(service);
        var rotation = Quaternion.CreateFromYawPitchRoll(0.1f, 0.2f, 0.3f);

        source.Emit(Reading(rotation: rotation));

        received().Should().BeTrue();
        sample().Rotation.Should().Be(rotation);
    }

    [Fact]
    public void Mapping_Timestamp()
    {
        var (service, source) = Create();
        var (received, sample) = Capture(service);

        source.Emit(Reading(timestamp: 987.6));

        received().Should().BeTrue();
        sample().Timestamp.Should().Be(987.6);
    }

    [Fact]
    public void Mapping_PreservesMagnitude_InG()
    {
        var (service, source) = Create();
        var (received, sample) = Capture(service);

        source.Emit(Reading(acceleration: new Vector3(0, 0, 2)));

        received().Should().BeTrue();
        var acceleration = sample().AccelerationIncludingGravity;
        Math.Sqrt((acceleration.X * acceleration.X) + (acceleration.Y * acceleration.Y) + (acceleration.Z * acceleration.Z))
            .Should().BeApproximately(2.0, 1e-9);
    }

    private static (SensorService Service, FakeAccelerometerSource Source) Create()
    {
        var source = new FakeAccelerometerSource();
        return (new SensorService(source), source);
    }

    private static (Func<bool> Received, Func<MotionSample> Sample) Capture(SensorService service)
    {
        var sample = default(MotionSample);
        var received = false;
        service.Start(s =>
        {
            sample = s;
            received = true;
        });

        return (() => received, () => sample);
    }

    private static AccelerometerReading Reading(
        Vector3? acceleration = null,
        double timestamp = 0,
        Vector3? rotationRate = null,
        Quaternion? rotation = null)
        => new(
            acceleration ?? new Vector3(0, 0, 1),
            rotationRate ?? new Vector3(0, 0, 0),
            rotation ?? Quaternion.Identity,
            timestamp);
}
