using FluentAssertions;
using InclinationTest.Core.Persistence;
using InclinationTest.Core.Recording;
using InclinationTest.Core.Tests.TestUtils;
using Xunit;

namespace InclinationTest.Core.Tests.Persistence;

public abstract class ReportRepositoryContractTests
{
    protected abstract IReportRepository CreateRepository();

    [Fact]
    public void CreateRecording_StoresInterruptedHeader()
    {
        var repository = CreateRepository();

        repository.CreateRecording("r1", 1000);

        var header = repository.GetRecording("r1");
        header.Should().NotBeNull();
        header!.Id.Should().Be("r1");
        header.Status.Should().Be(RecordingStatus.Recording);
        header.StartedAtMs.Should().Be(1000);
        header.FinishedAtMs.Should().BeNull();
    }

    [Fact]
    public void CreateRecording_Twice_IsIdempotent()
    {
        var repository = CreateRepository();

        repository.CreateRecording("r1", 1000);
        repository.CreateRecording("r1", 1000);

        repository.FindInterrupted().Should().HaveCount(1);
    }

    [Fact]
    public void AppendSamples_ThenGetSamples_ReturnsOrdered()
    {
        var repository = CreateRepository();
        repository.CreateRecording("r1", 0);

        repository.AppendSamples("r1", new[]
        {
            RecordingFixtures.Sample(166, 3, 4),
            RecordingFixtures.Sample(0, 1, 2),
        });

        var samples = repository.GetSamples("r1");
        samples.Select(sample => sample.ElapsedMs).Should().Equal(0, 166);
    }

    [Fact]
    public void AppendSamples_DuplicateElapsed_DoesNotDuplicate()
    {
        var repository = CreateRepository();
        repository.CreateRecording("r1", 0);

        repository.AppendSamples("r1", new[] { RecordingFixtures.Sample(0, 1, 2) });
        repository.AppendSamples("r1", new[] { RecordingFixtures.Sample(0, 9, 9) });

        repository.GetSamples("r1").Should().HaveCount(1);
    }

    [Fact]
    public void AppendSamples_UnknownRecording_Throws()
    {
        var repository = CreateRepository();

        var act = () => repository.AppendSamples("missing", new[] { RecordingFixtures.Sample(0, 1, 2) });

        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void SaveRecording_MarksSavedAndLists()
    {
        var repository = CreateRepository();
        repository.CreateRecording("r1", 0);
        var summary = Summary();

        repository.SaveRecording("r1", "Prova de Inclinação", summary, 5000);

        var header = repository.GetRecording("r1")!;
        header.Status.Should().Be(RecordingStatus.Saved);
        header.Title.Should().Be("Prova de Inclinação");
        header.FinishedAtMs.Should().Be(5000);
        header.Summary.Should().Be(summary);
        repository.ListReports().Should().ContainSingle(report => report.Id == "r1");
    }

    [Fact]
    public void ListReports_ExcludesInterrupted()
    {
        var repository = CreateRepository();
        repository.CreateRecording("in-progress", 0);
        repository.CreateRecording("saved", 0);
        repository.SaveRecording("saved", "x", Summary(), 1);

        repository.ListReports().Select(header => header.Id).Should().Equal("saved");
    }

    [Fact]
    public void ListReports_OrderedByStartDescending()
    {
        var repository = CreateRepository();
        repository.CreateRecording("older", 100);
        repository.SaveRecording("older", "a", Summary(), 200);
        repository.CreateRecording("newer", 300);
        repository.SaveRecording("newer", "b", Summary(), 400);

        repository.ListReports().Select(header => header.Id).Should().Equal("newer", "older");
    }

    [Fact]
    public void FindInterrupted_ReturnsOnlyRecording()
    {
        var repository = CreateRepository();
        repository.CreateRecording("in-progress", 0);
        repository.CreateRecording("saved", 0);
        repository.SaveRecording("saved", "x", Summary(), 1);

        repository.FindInterrupted().Select(header => header.Id).Should().Equal("in-progress");
    }

    [Fact]
    public void GetRecording_Unknown_ReturnsNull()
    {
        CreateRepository().GetRecording("missing").Should().BeNull();
    }

    [Fact]
    public void GetSamples_Unknown_ReturnsEmpty()
    {
        CreateRepository().GetSamples("missing").Should().BeEmpty();
    }

    [Fact]
    public void DeleteRecording_RemovesHeaderAndSamples()
    {
        var repository = CreateRepository();
        repository.CreateRecording("r1", 0);
        repository.AppendSamples("r1", new[] { RecordingFixtures.Sample(0, 1, 2) });

        repository.DeleteRecording("r1");

        repository.GetRecording("r1").Should().BeNull();
        repository.GetSamples("r1").Should().BeEmpty();
    }

    [Fact]
    public void DeleteRecording_Unknown_DoesNotThrow()
    {
        var repository = CreateRepository();

        var act = () => repository.DeleteRecording("missing");

        act.Should().NotThrow();
    }

    [Fact]
    public void GetSamples_ReturnsIndependentCopies()
    {
        var repository = CreateRepository();
        repository.CreateRecording("r1", 0);
        repository.AppendSamples("r1", new[] { RecordingFixtures.Sample(0, 1, 2) });

        var first = repository.GetSamples("r1");
        var second = repository.GetSamples("r1");

        second.Should().NotBeSameAs(first);
    }

    [Fact]
    public void Location_RoundTrips()
    {
        var repository = CreateRepository();

        repository.CreateRecording("r1", 0, "Santos — Porto");
        repository.CreateRecording("r2", 0);

        repository.GetRecording("r1")!.Location.Should().Be("Santos — Porto");
        repository.GetRecording("r2")!.Location.Should().BeNull();
    }

    private static RecordingSummary Summary()
        => new(1000, 3, 1, 0.5, 0, 2, 10, 0.5, 9, 11);
}
