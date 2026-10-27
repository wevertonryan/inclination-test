using FluentAssertions;
using InclinationTest.Core.Persistence;
using InclinationTest.Core.Recording;
using InclinationTest.Core.Tests.TestUtils;
using InclinationTest.Core.Tests.TestUtils.Fakes;
using Xunit;

namespace InclinationTest.Core.Tests.Persistence;

public class FileReportRepositoryTests : ReportRepositoryContractTests
{
    protected override IReportRepository CreateRepository()
        => new FileReportRepository(new FakeReportStorage());

    [Fact]
    public void ReopeningRepository_KeepsSavedReportsAndSamples()
    {
        var storage = new FakeReportStorage();
        var first = new FileReportRepository(storage);

        first.CreateRecording("r1", 1000, "Santos — Porto");
        first.AppendSamples("r1", new[]
        {
            RecordingFixtures.Sample(0, 1, 2),
            RecordingFixtures.Sample(166, 3, 4),
        });
        first.SaveRecording("r1", "Prova de Inclinação", Summary(), 5000);

        var second = new FileReportRepository(storage);

        second.ListReports().Should().ContainSingle(report => report.Id == "r1");
        second.GetRecording("r1")!.Title.Should().Be("Prova de Inclinação");
        second.GetRecording("r1")!.Location.Should().Be("Santos — Porto");
        second.GetRecording("r1")!.Summary.Should().Be(Summary());
        second.GetSamples("r1").Select(sample => sample.ElapsedMs).Should().Equal(0, 166);
    }

    [Fact]
    public void ReopeningRepository_KeepsInterruptedRecording()
    {
        var storage = new FakeReportStorage();
        var first = new FileReportRepository(storage);

        first.CreateRecording("r1", 1000);
        first.AppendSamples("r1", new[] { RecordingFixtures.Sample(0, 1, 2) });

        var second = new FileReportRepository(storage);

        second.FindInterrupted().Select(header => header.Id).Should().Equal("r1");
        second.ListReports().Should().BeEmpty();
        second.GetSamples("r1").Should().ContainSingle();
    }

    [Fact]
    public void ListReports_IgnoresCorruptHeader()
    {
        var storage = new FakeReportStorage();
        var repository = new FileReportRepository(storage);

        repository.CreateRecording("bom", 0);
        repository.SaveRecording("bom", "ok", Summary(), 1);
        storage.WriteAllText("quebrado.hdr", "isto não é um cabeçalho");

        var reopened = new FileReportRepository(storage);

        reopened.ListReports().Select(header => header.Id).Should().Equal("bom");
    }

    [Fact]
    public void SavedRecording_GetsWallClockTimestamps()
    {
        var repository = CreateRepository();
        var before = DateTimeOffset.UtcNow;

        repository.CreateRecording("r1", 0);
        repository.SaveRecording("r1", "x", Summary(), 1);

        var header = repository.GetRecording("r1")!;
        header.StartedAtUtc.Should().BeOnOrAfter(before);
        header.SavedAtUtc.Should().NotBeNull();
        header.SavedAtUtc!.Value.Should().BeOnOrAfter(header.StartedAtUtc!.Value);
    }

    private static RecordingSummary Summary()
        => new(1000, 3, 1, 0.5, 0, 2, 10, 0.5, 9, 11);
}
