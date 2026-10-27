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
    private readonly ObservableCollection<ReportItem> _visibleReports = new();
    private readonly ObservableCollection<string> _locations = new();

    private ReportItem? _selected;
    private IReadOnlyList<RecordedSample> _selectedSamples = Array.Empty<RecordedSample>();
    private string _searchText = string.Empty;
    private string? _selectedLocation;
    private bool _sortDescending = true;

    public ReportsViewModel(IReportRepository repository)
    {
        _repository = repository;
        Reports = new ReadOnlyObservableCollection<ReportItem>(_reports);
        VisibleReports = new ReadOnlyObservableCollection<ReportItem>(_visibleReports);
        Locations = new ReadOnlyObservableCollection<string>(_locations);
    }

    public ReadOnlyObservableCollection<ReportItem> Reports { get; }

    public ReadOnlyObservableCollection<ReportItem> VisibleReports { get; }

    public ReadOnlyObservableCollection<string> Locations { get; }

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

    public string SearchText
    {
        get => _searchText;
        set
        {
            if (SetProperty(ref _searchText, value ?? string.Empty))
            {
                ApplyFilter();
            }
        }
    }

    public string? SelectedLocation
    {
        get => _selectedLocation;
        set
        {
            if (SetProperty(ref _selectedLocation, value))
            {
                ApplyFilter();
            }
        }
    }

    public bool SortDescending
    {
        get => _sortDescending;
        private set
        {
            if (SetProperty(ref _sortDescending, value))
            {
                OnPropertyChanged(nameof(SortLabel));
                ApplyFilter();
            }
        }
    }

    public string SortLabel => _sortDescending ? "Mais recentes" : "Mais antigos";

    public bool IsEmpty => _reports.Count == 0;

    public bool IsFilteredEmpty => _visibleReports.Count == 0;

    public bool HasActiveFilter => !string.IsNullOrWhiteSpace(_searchText)
        || !string.IsNullOrWhiteSpace(_selectedLocation);

    public int VisibleCount => _visibleReports.Count;

    public string VisibleCountText => _visibleReports.Count.ToString(CultureInfo.InvariantCulture);

    public string ListTitle => HasActiveFilter ? "Relatórios filtrados" : "Todos os relatórios";

    public string SummaryText => _reports.Count switch
    {
        0 => "nenhuma gravação",
        1 => "1 gravação",
        _ => $"{_reports.Count} gravações",
    };

    public string VisibleSummaryText => _visibleReports.Count switch
    {
        0 => "nenhuma gravação",
        1 => "1 gravação",
        _ => $"{_visibleReports.Count} gravações",
    };

    public void Refresh()
    {
        Close();

        _reports.Clear();
        _locations.Clear();

        foreach (var header in _repository.ListReports())
        {
            _reports.Add(ToItem(header));
        }

        var locations = _reports
            .Select(item => item.LocationText)
            .Where(location => !string.IsNullOrWhiteSpace(location) && location != "—")
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(location => location, StringComparer.OrdinalIgnoreCase);

        foreach (var location in locations)
        {
            _locations.Add(location);
        }

        if (_selectedLocation is not null && !_locations.Contains(_selectedLocation))
        {
            _selectedLocation = null;
            OnPropertyChanged(nameof(SelectedLocation));
        }

        ApplyFilter();
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

    public void ToggleSort() => SortDescending = !SortDescending;

    public string? DeleteSelected()
    {
        if (_selected is null)
        {
            return null;
        }

        var title = _selected.Title;
        _repository.DeleteRecording(_selected.Id);
        Refresh();
        return title;
    }

    public void ClearFilters()
    {
        _searchText = string.Empty;
        _selectedLocation = null;
        OnPropertyChanged(nameof(SearchText));
        OnPropertyChanged(nameof(SelectedLocation));
        ApplyFilter();
    }

    private void ApplyFilter()
    {
        IEnumerable<ReportItem> items = _reports;

        if (!string.IsNullOrWhiteSpace(_searchText))
        {
            var term = _searchText.Trim();
            items = items.Where(item =>
                item.Title.Contains(term, StringComparison.OrdinalIgnoreCase)
                || item.LocationText.Contains(term, StringComparison.OrdinalIgnoreCase)
                || item.DateText.Contains(term, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(_selectedLocation))
        {
            items = items.Where(item =>
                string.Equals(item.LocationText, _selectedLocation, StringComparison.OrdinalIgnoreCase));
        }

        items = _sortDescending
            ? items.OrderByDescending(item => item.SavedAtUtc)
            : items.OrderBy(item => item.SavedAtUtc);

        _visibleReports.Clear();

        foreach (var item in items)
        {
            _visibleReports.Add(item);
        }

        OnPropertyChanged(nameof(VisibleCount));
        OnPropertyChanged(nameof(VisibleCountText));
        OnPropertyChanged(nameof(IsFilteredEmpty));
        OnPropertyChanged(nameof(HasActiveFilter));
        OnPropertyChanged(nameof(ListTitle));
        OnPropertyChanged(nameof(VisibleSummaryText));
    }

    private static ReportItem ToItem(RecordingHeader header)
    {
        var summary = header.Summary ?? default;
        var durationMs = summary.DurationMs > 0 ? summary.DurationMs : header.DurationMs;
        var savedAt = header.SavedAtUtc ?? header.StartedAtUtc;
        var local = savedAt?.ToLocalTime();
        var date = FormatDate(savedAt);
        var dateOnly = local?.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture) ?? "—";
        var timeOnly = local?.ToString("HH:mm", CultureInfo.InvariantCulture) ?? "—";
        var duration = FormatDuration(durationMs);
        var durationLong = FormatDurationLong(durationMs);
        var samples = FormatSamples(summary.SampleCount);
        var interval = summary.SampleCount > 1
            ? $"{durationMs / (double)(summary.SampleCount - 1):0} ms"
            : "—";

        return new ReportItem(
            header.Id,
            string.IsNullOrWhiteSpace(header.Title) ? "Sem nome" : header.Title,
            date,
            duration,
            $"{date} · {duration} · {samples}",
            FormatAngle(summary.MeanRoll, summary.StdRoll),
            FormatAngle(summary.MeanTrim, summary.StdTrim))
        {
            LocationText = string.IsNullOrWhiteSpace(header.Location) ? "—" : header.Location,
            DateOnlyText = dateOnly,
            TimeOnlyText = timeOnly,
            DurationLongText = durationLong,
            SampleCountText = samples,
            IntervalText = interval,
            RollMeanText = FormatAngle(summary.MeanRoll),
            RollStdText = FormatAngle(summary.StdRoll),
            TrimMeanText = FormatAngle(summary.MeanTrim),
            TrimStdText = FormatAngle(summary.StdTrim),
            RollMinText = FormatAngle(summary.MinRoll),
            RollMaxText = FormatAngle(summary.MaxRoll),
            RollRangeText = $"{summary.RollRange:0.0}°",
            RollMinValue = summary.MinRoll,
            RollMaxValue = summary.MaxRoll,
            RollMeanValue = summary.MeanRoll,
            DurationMs = durationMs,
            SampleCount = summary.SampleCount,
            SavedAtUtc = savedAt,
        };
    }

    private static string FormatDate(DateTimeOffset? value)
        => value?.ToLocalTime().ToString("dd/MM/yyyy HH:mm", CultureInfo.InvariantCulture) ?? "—";

    private static string FormatAngle(double value)
        => $"{value:+0.0;-0.0;0.0}°";

    private static string FormatAngle(double mean, double std)
        => $"{mean:+0.0;-0.0;0.0}° ± {std:0.0}°";

    private static string FormatDuration(long durationMs)
    {
        var total = (int)(durationMs / 1000);
        var hours = total / 3600;

        return hours > 0
            ? $"{hours}:{total / 60 % 60:00}:{total % 60:00}"
            : $"{total / 60}:{total % 60:00}";
    }

    private static string FormatDurationLong(long durationMs)
    {
        var total = (int)(durationMs / 1000);
        return $"{total / 3600:00}:{total / 60 % 60:00}:{total % 60:00}";
    }

    private static string FormatSamples(int count)
        => count == 1 ? "1 amostra" : $"{count} amostras";
}
