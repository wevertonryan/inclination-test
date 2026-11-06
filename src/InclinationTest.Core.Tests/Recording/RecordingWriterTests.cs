using FluentAssertions;
using InclinationTest.Core.Recording;
using InclinationTest.Core.Tests.TestUtils;
using InclinationTest.Core.Tests.TestUtils.Fakes;
using Xunit;

namespace InclinationTest.Core.Tests.Recording;

public class RecordingWriterTests
{
    [Fact]
    public void Started_CreatesRecording()
    {
        var (writer, session, repository, _) = Create();
        using (writer)
        {
            session.Start(1000);
        }

        repository.Created.Should().ContainSingle();
        repository.Created[0].Id.Should().Be(session.Id);
        repository.Created[0].StartedAtMs.Should().Be(1000);
    }

    [Fact]
    public void BatchReady_AppendsSamples()
    {
        var (writer, session, repository, _) = Create();
        using (writer)
        {
            session.Start(0);
            session.EmitBatch(
                RecordingFixtures.Sample(0, 1, 2),
                RecordingFixtures.Sample(83, 3, 4));
        }

        repository.Appended.Should().ContainSingle();
        repository.Appended[0].Id.Should().Be(session.Id);
        repository.Appended[0].Samples.Should().HaveCount(2);
    }

    [Fact]
    public void FinishedSaved_PersistsSummary()
    {
        var (writer, session, repository, _) = Create();
        using (writer)
        {
            session.Start(0);
            session.Save("Prova de Inclinação");
        }

        repository.Saved.Should().ContainSingle();
        repository.Saved[0].Id.Should().Be(session.Id);
        repository.Saved[0].Title.Should().Be("Prova de Inclinação");
    }

    [Fact]
    public void FinishedDiscarded_DeletesRecording()
    {
        var (writer, session, repository, _) = Create();
        using (writer)
        {
            session.Start(0);
            session.Discard();
        }

        repository.Deleted.Should().ContainSingle();
        repository.Deleted[0].Should().Be(session.Id);
    }

    [Fact]
    public void Calls_PreserveOrder()
    {
        var (writer, session, repository, _) = Create();
        using (writer)
        {
            session.Start(0);
            session.EmitBatch(RecordingFixtures.Sample(0, 1, 2));
            session.Save("x");
        }

        repository.Calls.Should().Equal("create", "append", "save");
    }

    [Fact]
    public void Work_IsRoutedThroughExecutor()
    {
        var (writer, session, _, executor) = Create();
        using (writer)
        {
            session.Start(0);
            session.EmitBatch(RecordingFixtures.Sample(0, 1, 2));
            session.Save("x");
        }

        executor.PostCount.Should().Be(3);
    }

    [Fact]
    public void NoWrites_AfterFinish()
    {
        var (writer, session, repository, _) = Create();
        using (writer)
        {
            session.Start(0);
            session.Save("x");

            session.EmitBatch(RecordingFixtures.Sample(2000, 1, 2));
        }

        repository.Calls.Should().Equal("create", "save");
    }

    private static (RecordingWriter Writer, FakeRecordingSession Session, SpyReportRepository Repository, InlineSerialExecutor Executor) Create()
    {
        var session = new FakeRecordingSession();
        var repository = new SpyReportRepository();
        var executor = new InlineSerialExecutor();

        return (new RecordingWriter(session, repository, executor), session, repository, executor);
    }
}
