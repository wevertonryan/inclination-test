using FluentAssertions;
using InclinationTest.Core.Persistence;
using InclinationTest.Core.Recording;
using InclinationTest.Core.Tests.TestUtils;
using InclinationTest.Core.ViewModels;
using Xunit;

namespace InclinationTest.Core.Tests.ViewModels;

public class ReportsViewModelTests
{
    [Fact]
    public void Refresh_EmptyRepository_HasNoReports()
    {
        var viewModel = Create(out _);

        viewModel.Refresh();

        viewModel.IsEmpty.Should().BeTrue();
        viewModel.Reports.Should().BeEmpty();
        viewModel.HasSelection.Should().BeFalse();
        viewModel.SummaryText.Should().Be("nenhuma gravação");
    }

    [Fact]
    public void Refresh_ListsSavedReportsNewestFirst()
    {
        var viewModel = Create(out var repository);
        AddSaved(repository, "antiga", startedAtMs: 100);
        AddSaved(repository, "nova", startedAtMs: 900);

        viewModel.Refresh();

        viewModel.Reports.Select(item => item.Title).Should().Equal("nova", "antiga");
        viewModel.IsEmpty.Should().BeFalse();
        viewModel.SummaryText.Should().Be("2 gravações");
    }

    [Fact]
    public void Refresh_SkipsInterruptedRecording()
    {
        var viewModel = Create(out var repository);
        repository.CreateRecording("em-andamento", 0);
        AddSaved(repository, "pronta", startedAtMs: 100);

        viewModel.Refresh();

        viewModel.Reports.Select(item => item.Id).Should().Equal("pronta");
    }

    [Fact]
    public void Open_LoadsSamplesAndFlagsSelection()
    {
        var viewModel = Create(out var repository);
        AddSaved(
            repository,
            "prova",
            startedAtMs: 100,
            samples: new[]
            {
                RecordingFixtures.Sample(166, 3, 4),
                RecordingFixtures.Sample(0, 1, 2),
            });

        viewModel.Refresh();
        var item = viewModel.Reports[0];

        viewModel.Open(item);

        viewModel.HasSelection.Should().BeTrue();
        viewModel.Selected.Should().Be(item);
        viewModel.SelectedSamples.Select(sample => sample.ElapsedMs).Should().Equal(0, 166);
    }

    [Fact]
    public void Close_ClearsSelection()
    {
        var viewModel = Create(out var repository);
        AddSaved(repository, "prova", startedAtMs: 100);
        viewModel.Refresh();
        viewModel.Open(viewModel.Reports[0]);

        viewModel.Close();

        viewModel.HasSelection.Should().BeFalse();
        viewModel.Selected.Should().BeNull();
        viewModel.SelectedSamples.Should().BeEmpty();
    }

    [Fact]
    public void Refresh_FormatsDurationAndMeta()
    {
        var viewModel = Create(out var repository);
        repository.CreateRecording("r1", 0);
        repository.SaveRecording(
            "r1",
            "prova",
            new RecordingSummary(125_000, 17, 1, 0.5, 0, 2, 10, 0.5, 9, 11),
            1);

        viewModel.Refresh();

        var item = viewModel.Reports[0];
        item.DurationText.Should().Be("2:05");
        item.MetaText.Should().Contain("2:05").And.Contain("17 amostras");
    }

    [Fact]
    public void Refresh_BlankTitle_FallsBackToSemNome()
    {
        var viewModel = Create(out var repository);
        repository.CreateRecording("r1", 0);
        repository.SaveRecording("r1", "   ", new RecordingSummary(1000, 1, 0, 0, 0, 0, 0, 0, 0, 0), 1);

        viewModel.Refresh();

        viewModel.Reports[0].Title.Should().Be("Sem nome");
    }

    private static ReportsViewModel Create(out InMemoryReportRepository repository)
    {
        repository = new InMemoryReportRepository();

        return new ReportsViewModel(repository);
    }

    private static void AddSaved(
        InMemoryReportRepository repository,
        string title,
        double startedAtMs,
        IReadOnlyList<RecordedSample>? samples = null)
    {
        repository.CreateRecording(title, startedAtMs);

        if (samples is not null)
        {
            repository.AppendSamples(title, samples);
        }

        var summary = new RecordingSummary(
            samples?.Count * 83L ?? 83,
            samples?.Count ?? 1,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0);

        repository.SaveRecording(title, title, summary, startedAtMs + 1000);
    }
}
