using FluentAssertions;
using InclinationTest.Core.Recording;
using InclinationTest.Core.Tests.TestUtils;
using InclinationTest.Core.Tests.TestUtils.Fakes;
using Xunit;

namespace InclinationTest.Core.Tests.Recording;

public class RecordingWriterMultipleTests
{
    [Fact]
    public void SecondRecording_IsAlsoPersisted()
    {
        var (writer, session, repository) = Create();

        using (writer)
        {
            session.Start(0);
            session.Save("primeira");
            session.Start(100);
            session.Save("segunda");
        }

        repository.Created.Should().HaveCount(2);
        repository.Saved.Should().HaveCount(2);
        repository.Saved[1].Title.Should().Be("segunda");
        repository.Saved.Select(saved => saved.Id).Should().OnlyHaveUniqueItems();
    }

    [Fact]
    public void SecondRecording_AppendsSamplesAgain()
    {
        var (writer, session, repository) = Create();

        using (writer)
        {
            session.Start(0);
            session.EmitBatch(RecordingFixtures.Sample(0, 1, 2));
            session.Save("primeira");
            session.Start(100);
            session.EmitBatch(RecordingFixtures.Sample(100, 3, 4));
            session.Save("segunda");
        }

        repository.Appended.Should().HaveCount(2);
    }

    [Fact]
    public void Saved_EventFiresForEachSave()
    {
        var (writer, session, repository) = Create();
        var saved = new List<string>();

        writer.Saved += saved.Add;

        using (writer)
        {
            session.Start(0);
            session.Save("primeira");
            session.Start(100);
            session.Save("segunda");
        }

        saved.Should().HaveCount(2);
        saved.Should().Equal(repository.Saved.Select(entry => entry.Id));
    }

    private static (RecordingWriter Writer, FakeRecordingSession Session, SpyReportRepository Repository) Create()
    {
        var session = new FakeRecordingSession();
        var repository = new SpyReportRepository();

        return (new RecordingWriter(session, repository, new InlineSerialExecutor()), session, repository);
    }
}
