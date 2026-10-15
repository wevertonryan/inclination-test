using FluentAssertions;
using InclinationTest.Core.Recording;
using InclinationTest.Core.Tests.TestUtils;
using Xunit;

namespace InclinationTest.Core.Tests.Recording;

public class RecordingSessionTests
{
    // --- Estado inicial ---

    [Fact]
    public void Initial_StateIdle()
    {
        Create().State.Should().Be(SessionState.Idle);
    }

    [Fact]
    public void Initial_IdNull()
    {
        Create().Id.Should().BeNull();
    }

    [Fact]
    public void Initial_SampleCountZero()
    {
        Create().SampleCount.Should().Be(0);
    }

    [Fact]
    public void Initial_DurationZero()
    {
        Create().DurationMs.Should().Be(0);
    }

    // --- Ciclo de vida ---

    [Fact]
    public void Start_SetsStateRecording()
    {
        var session = Create();

        session.Start(0);

        session.State.Should().Be(SessionState.Recording);
    }

    [Fact]
    public void Start_RaisesStartedOnceWithId()
    {
        var session = Create();
        var started = new List<RecordingStarted>();
        session.Started += started.Add;

        session.Start(1000);

        started.Should().ContainSingle();
        started[0].Id.Should().NotBeNullOrEmpty();
        started[0].TimestampMs.Should().Be(1000);
    }

    [Fact]
    public void Start_Twice_RaisesStartedOnce()
    {
        var session = Create();
        var started = new List<RecordingStarted>();
        session.Started += started.Add;

        session.Start(1000);
        session.Start(2000);

        started.Should().HaveCount(1);
    }

    [Fact]
    public void Start_Twice_KeepsId()
    {
        var session = Create();

        session.Start(1000);
        var id = session.Id;
        session.Start(2000);

        session.Id.Should().Be(id);
    }

    // --- Decimação ---

    [Fact]
    public void Append_BeforeStart_IsIgnored()
    {
        var session = Create();

        var accepted = session.Append(RecordingFixtures.Angle(1, 2), 0);

        accepted.Should().BeNull();
        session.SampleCount.Should().Be(0);
    }

    [Fact]
    public void Append_AcceptsFirstSample()
    {
        var session = Create();
        session.Start(0);

        var accepted = session.Append(RecordingFixtures.Angle(5, 6), 0);

        accepted.Should().NotBeNull();
        accepted!.Value.Roll.Should().BeApproximately(5, 1e-9);
        accepted.Value.Trim.Should().BeApproximately(6, 1e-9);
    }

    [Fact]
    public void Decimation_RejectsSampleBeforeInterval()
    {
        var session = Create();
        session.Start(0);
        session.Append(RecordingFixtures.Angle(1, 0), 0);

        var accepted = session.Append(RecordingFixtures.Angle(2, 0), 16);

        accepted.Should().BeNull();
    }

    [Fact]
    public void Decimation_AcceptsSampleAtInterval()
    {
        var session = Create();
        session.Start(0);
        session.Append(RecordingFixtures.Angle(1, 0), 0);

        var accepted = session.Append(RecordingFixtures.Angle(2, 0), 83);

        accepted.Should().NotBeNull();
    }

    [Fact]
    public void Decimation_KeepsOnlyIntervalSamples()
    {
        var session = Create();
        session.Start(0);

        foreach (var timestamp in new[] { 0.0, 16, 33, 50, 66, 83, 100, 166 })
        {
            session.Append(RecordingFixtures.Angle(0, 0), timestamp);
        }

        session.SampleCount.Should().Be(3);
    }

    [Fact]
    public void Append_ElapsedMsIsRelativeToStart()
    {
        var session = Create();
        session.Start(1000);

        var first = session.Append(RecordingFixtures.Angle(0, 0), 1000);
        var second = session.Append(RecordingFixtures.Angle(0, 0), 1083);

        first!.Value.ElapsedMs.Should().Be(0);
        second!.Value.ElapsedMs.Should().Be(83);
    }

    // --- Pausa / retomada ---

    [Fact]
    public void Pause_SetsStatePaused()
    {
        var session = Create();
        session.Start(0);

        session.Pause(0);

        session.State.Should().Be(SessionState.Paused);
    }

    [Fact]
    public void Append_WhilePaused_IsIgnored()
    {
        var session = Create();
        session.Start(0);
        session.Append(RecordingFixtures.Angle(1, 0), 0);
        session.Pause(0);

        var accepted = session.Append(RecordingFixtures.Angle(2, 0), 100);

        accepted.Should().BeNull();
        session.SampleCount.Should().Be(1);
    }

    [Fact]
    public void Resume_SetsStateRecording()
    {
        var session = Create();
        session.Start(0);
        session.Pause(0);

        session.Resume(100);

        session.State.Should().Be(SessionState.Recording);
    }

    [Fact]
    public void Append_AfterResume_IsAccepted()
    {
        var session = Create();
        session.Start(0);
        session.Append(RecordingFixtures.Angle(1, 0), 0);
        session.Pause(100);
        session.Resume(200);

        var accepted = session.Append(RecordingFixtures.Angle(2, 0), 283);

        accepted.Should().NotBeNull();
    }

    [Fact]
    public void Duration_EqualsLastAcceptedElapsed()
    {
        var session = Create();
        session.Start(0);
        session.Append(RecordingFixtures.Angle(0, 0), 0);
        session.Append(RecordingFixtures.Angle(0, 0), 83);
        session.Append(RecordingFixtures.Angle(0, 0), 166);

        session.DurationMs.Should().Be(166);
    }

    [Fact]
    public void Duration_ExcludesPausedTime()
    {
        var session = Create();
        session.Start(0);
        session.Append(RecordingFixtures.Angle(0, 0), 0);
        session.Append(RecordingFixtures.Angle(0, 0), 1000);
        session.Pause(1000);
        session.Resume(5000);

        var accepted = session.Append(RecordingFixtures.Angle(0, 0), 5083);

        accepted.Should().NotBeNull();
        session.DurationMs.Should().Be(1083);
    }

    // --- Lotes ---

    [Fact]
    public void BatchReady_EmittedWhenFlushIntervalReached()
    {
        var session = Create(flushIntervalMs: 200);
        var batches = new List<SampleBatch>();
        session.BatchReady += batches.Add;
        session.Start(0);

        foreach (var timestamp in new[] { 0.0, 83, 166, 249 })
        {
            session.Append(RecordingFixtures.Angle(0, 0), timestamp);
        }

        batches.Should().ContainSingle();
        batches[0].Samples.Should().HaveCount(4);
    }

    [Fact]
    public void Batch_ResetsBuffer()
    {
        var session = Create(flushIntervalMs: 200);
        var batches = new List<SampleBatch>();
        session.BatchReady += batches.Add;
        session.Start(0);

        foreach (var timestamp in new[] { 0.0, 83, 166, 249 })
        {
            session.Append(RecordingFixtures.Angle(0, 0), timestamp);
        }

        foreach (var timestamp in new[] { 332.0, 415, 498 })
        {
            session.Append(RecordingFixtures.Angle(0, 0), timestamp);
        }

        batches.Should().HaveCount(2);
        batches[1].Samples.Should().HaveCount(3);
    }

    [Fact]
    public void Batch_ElapsedMsRelativeToStart()
    {
        var session = Create(flushIntervalMs: 200);
        var batches = new List<SampleBatch>();
        session.BatchReady += batches.Add;
        session.Start(1000);

        foreach (var timestamp in new[] { 1000.0, 1083, 1166, 1249 })
        {
            session.Append(RecordingFixtures.Angle(0, 0), timestamp);
        }

        batches.Should().ContainSingle();
        batches[0].Samples[0].ElapsedMs.Should().Be(0);
        batches[0].Samples[^1].ElapsedMs.Should().Be(249);
    }

    [Fact]
    public void Batch_SamplesOrderedByElapsed()
    {
        var session = Create(flushIntervalMs: 200);
        var batches = new List<SampleBatch>();
        session.BatchReady += batches.Add;
        session.Start(0);

        foreach (var timestamp in new[] { 0.0, 83, 166, 249 })
        {
            session.Append(RecordingFixtures.Angle(0, 0), timestamp);
        }

        batches[0].Samples.Select(sample => sample.ElapsedMs).Should().BeInAscendingOrder();
    }

    [Fact]
    public void Batch_IdMatchesStartedId()
    {
        var session = Create(flushIntervalMs: 200);
        var batches = new List<SampleBatch>();
        session.BatchReady += batches.Add;
        session.Start(0);
        var id = session.Id;

        foreach (var timestamp in new[] { 0.0, 83, 166, 249 })
        {
            session.Append(RecordingFixtures.Angle(0, 0), timestamp);
        }

        batches[0].Id.Should().Be(id);
    }

    // --- Save / Discard ---

    [Fact]
    public void Save_RaisesFinishedSaved()
    {
        var session = Create();
        var finished = new List<RecordingFinished>();
        session.Finished += finished.Add;
        session.Start(0);
        session.Append(RecordingFixtures.Angle(0, 0), 0);

        session.Save("Prova de Inclinação");

        finished.Should().ContainSingle();
        finished[0].Reason.Should().Be(FinishReason.Saved);
        finished[0].Title.Should().Be("Prova de Inclinação");
    }

    [Fact]
    public void Save_FlushesPendingBatchBeforeFinished()
    {
        var session = Create();
        var order = new List<string>();
        session.BatchReady += _ => order.Add("batch");
        session.Finished += _ => order.Add("finished");
        session.Start(0);
        session.Append(RecordingFixtures.Angle(0, 0), 0);

        session.Save("x");

        order.Should().Equal("batch", "finished");
    }

    [Fact]
    public void Save_ReturnsSummaryOfAcceptedSamples()
    {
        var session = Create();
        session.Start(0);
        session.Append(RecordingFixtures.Angle(1, 10), 0);
        session.Append(RecordingFixtures.Angle(3, 30), 83);

        var summary = session.Save("x");

        summary.SampleCount.Should().Be(2);
        summary.MeanRoll.Should().BeApproximately(2, 1e-9);
        summary.MinRoll.Should().BeApproximately(1, 1e-9);
        summary.MaxRoll.Should().BeApproximately(3, 1e-9);
        summary.RollRange.Should().BeApproximately(2, 1e-9);
        summary.MeanTrim.Should().BeApproximately(20, 1e-9);
        summary.DurationMs.Should().Be(83);
    }

    [Fact]
    public void Save_SetsStateIdle()
    {
        var session = Create();
        session.Start(0);
        session.Append(RecordingFixtures.Angle(0, 0), 0);

        session.Save("x");

        session.State.Should().Be(SessionState.Idle);
    }

    [Fact]
    public void Save_FinishesIdConsistentWithStarted()
    {
        var session = Create();
        var finished = new List<RecordingFinished>();
        session.Finished += finished.Add;
        session.Start(0);
        session.Append(RecordingFixtures.Angle(0, 0), 0);
        var id = session.Id;

        session.Save("x");

        finished[0].Id.Should().Be(id);
    }

    [Fact]
    public void Discard_RaisesFinishedDiscarded()
    {
        var session = Create();
        var finished = new List<RecordingFinished>();
        session.Finished += finished.Add;
        session.Start(0);
        session.Append(RecordingFixtures.Angle(0, 0), 0);

        session.Discard();

        finished.Should().ContainSingle();
        finished[0].Reason.Should().Be(FinishReason.Discarded);
    }

    [Fact]
    public void Discard_SetsStateIdle()
    {
        var session = Create();
        session.Start(0);
        session.Append(RecordingFixtures.Angle(0, 0), 0);

        session.Discard();

        session.State.Should().Be(SessionState.Idle);
    }

    [Fact]
    public void Events_NotRaisedAfterFinish()
    {
        var session = Create();
        var batches = 0;
        session.BatchReady += _ => batches++;
        session.Start(0);
        session.Append(RecordingFixtures.Angle(0, 0), 0);
        session.Save("x");

        session.Append(RecordingFixtures.Angle(0, 0), 83);

        batches.Should().Be(1);
        session.SampleCount.Should().Be(1);
    }

    private static RecordingSession Create(int sampleIntervalMs = 83, int flushIntervalMs = 2000)
        => new(new RecordingOptions
        {
            SampleIntervalMs = sampleIntervalMs,
            FlushIntervalMs = flushIntervalMs,
        });
}
