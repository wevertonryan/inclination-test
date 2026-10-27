using System.Collections.ObjectModel;
using System.Globalization;
using CommunityToolkit.Mvvm.ComponentModel;
using InclinationTest.Core.Persistence;
using InclinationTest.Core.Recording;

namespace InclinationTest.Core.ViewModels;

/// <summary>
/// Lista as gravações salvas e carrega as amostras da que for aberta.
/// Não conhece o MAUI: a view só precisa chamar <see cref="Refresh"/> e ligar as propriedades.
/// </summary>
public sealed class ReportsViewModel : ObservableObject
{
    private readonly IReportRepository _repository;
    private readonly ObservableCollection<ReportItem> _reports = new();

    private ReportItem? _selected;
    private IReadOnlyList<RecordedSample> _selectedSamples = Array.Empty<RecordedSample>();

    public ReportsViewModel(IReportRepository repository)
    {
        _repository = repository;
        Reports = new ReadOnlyObservableCollection<ReportItem>(_reports);
    }

    public ReadOnlyObservableCollection<ReportItem> Reports { get; }

    public ReportItem? Selected
    {
        get => _selected;
        private set
        {
            if (SetProperty(ref _selected, value))
            {
                OnPropertyChanged(nameof(HasSelection));
            }
        }
    }

    public bool HasSelection => _selected is not null;

    public IReadOnlyList<RecordedSample> SelectedSamples
    {
        get => _selectedSamples;
        private set => SetProperty(ref _selectedSamples, value);
    }

    public bool IsEmpty => _reports.Count == 0;

    public string SummaryText => _reports.Count switch
    {
        0 => "nenhuma gravação",
        1 => "1 gravação",
        _ => $"{_reports.Count} gravações",
    };

    public void Refresh()
    {
        Close();

        _reports.Clear();

        foreach (var header in _repository.ListReports())
        {
            _reports.Add(ToItem(header));
        }

        OnPropertyChanged(nameof(IsEmpty));
        OnPropertyChanged(nameof(SummaryText));
    }

    public void Open(ReportItem item)
    {
        Selected = item;
        SelectedSamples = _repository.GetSamples(item.Id);
    }

    public void Close()
    {
        Selected = null;
        SelectedSamples = Array.Empty<RecordedSample>();
    }

    private static ReportItem ToItem(RecordingHeader header)
    {
        var summary = header.Summary ?? default;
        var durationMs = summary.DurationMs > 0 ? summary.DurationMs : header.DurationMs;
        var date = FormatDate(header.SavedAtUtc ?? header.StartedAtUtc);
        var duration = FormatDuration(durationMs);
        var samples = FormatSamples(summary.SampleCount);

        return new ReportItem(
            header.Id,
            string.IsNullOrWhiteSpace(header.Title) ? "Sem nome" : header.Title,
            date,
            duration,
            $"{date} · {duration} · {samples}",
            $"{summary.MeanRoll:0.0}° ± {summary.StdRoll:0.0}°",
            $"{summary.MeanTrim:0.0}° ± {summary.StdTrim:0.0}°");
    }

    private static string FormatDate(DateTimeOffset? value)
        => value?.ToLocalTime().ToString("dd/MM/yyyy HH:mm", CultureInfo.InvariantCulture) ?? "—";

    private static string FormatDuration(long durationMs)
    {
        var total = (int)(durationMs / 1000);
        var hours = total / 3600;

        return hours > 0
            ? $"{hours}:{total / 60 % 60:00}:{total % 60:00}"
            : $"{total / 60}:{total % 60:00}";
    }

    private static string FormatSamples(int count)
        => count == 1 ? "1 amostra" : $"{count} amostras";
}
