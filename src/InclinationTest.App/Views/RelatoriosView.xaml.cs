using System.ComponentModel;
using InclinationTest.App.Components.Features;
using InclinationTest.Core.Recording;
using InclinationTest.Core.ViewModels;
using Microsoft.Maui.ApplicationModel;
using UraniumUI.Icons.MaterialSymbols;

namespace InclinationTest.App.Views;

public partial class RelatoriosView : ContentView
{
    private readonly ReportsViewModel _viewModel;
    private readonly ReportChartView _chart = new();

    private CancellationTokenSource? _toastCancellation;

    public RelatoriosView(ReportsViewModel viewModel, RecordingWriter writer)
    {
        InitializeComponent();

        _viewModel = viewModel;
        BindingContext = viewModel;

        ChartHost.Children.Add(_chart);

        writer.Saved += OnRecordingSaved;
        viewModel.PropertyChanged += OnViewModelChanged;
        Loaded += OnLoaded;
    }

    private void OnLoaded(object? sender, EventArgs e) => _viewModel.Refresh();

    private void OnRecordingSaved(string recordingId)
        => MainThread.BeginInvokeOnMainThread(_viewModel.Refresh);

    private void OnViewModelChanged(object? sender, PropertyChangedEventArgs e)
    {
        if (e.PropertyName == nameof(ReportsViewModel.SelectedSamples))
        {
            UpdateSelectedSamples();
        }
    }

    private void OnReportSelected(object? sender, SelectionChangedEventArgs e)
    {
        if (e.CurrentSelection.FirstOrDefault() is not ReportItem item)
        {
            return;
        }

        ReportsList.SelectedItem = null;
        HideOverlay(FilterOverlay);
        _viewModel.Open(item);
    }

    private void OnBackClicked(object? sender, TappedEventArgs e)
    {
        HideOverlay(OptionsOverlay);
        HideOverlay(DeleteOverlay);
        _viewModel.Close();
    }

    private void OnClearSearchTapped(object? sender, TappedEventArgs e)
        => _viewModel.SearchText = string.Empty;

    private void OnFilterTapped(object? sender, TappedEventArgs e)
        => ShowOverlay(FilterOverlay);

    private void OnFilterDismissed(object? sender, TappedEventArgs e)
        => HideOverlay(FilterOverlay);

    private void OnSortTapped(object? sender, TappedEventArgs e)
        => _viewModel.ToggleSort();

    private void OnResetFiltersTapped(object? sender, TappedEventArgs e)
    {
        _viewModel.ClearFilters();
        HideOverlay(FilterOverlay);
    }

    private void OnAllLocationsTapped(object? sender, TappedEventArgs e)
        => _viewModel.SelectedLocation = null;

    private void OnOptionsTapped(object? sender, TappedEventArgs e)
    {
        if (_viewModel.HasSelection)
        {
            ShowOverlay(OptionsOverlay);
        }
    }

    private void OnOptionsDismissed(object? sender, TappedEventArgs e)
        => HideOverlay(OptionsOverlay);

    private void OnExportPdfTapped(object? sender, TappedEventArgs e)
    {
        HideOverlay(OptionsOverlay);
        ShowToast("Exportação PDF indisponível neste build.", ToastKind.Info);
    }

    private void OnDeleteTapped(object? sender, TappedEventArgs e)
    {
        HideOverlay(OptionsOverlay);
        ShowOverlay(DeleteOverlay);
    }

    private void OnDeleteDismissed(object? sender, TappedEventArgs e)
        => HideOverlay(DeleteOverlay);

    private void OnDeleteConfirmed(object? sender, TappedEventArgs e)
    {
        var deleted = _viewModel.DeleteSelected();
        HideOverlay(DeleteOverlay);

        if (deleted is not null)
        {
            ShowToast($"“{deleted}” excluído.", ToastKind.Success);
        }
    }

    private void UpdateSelectedSamples()
    {
        var samples = _viewModel.SelectedSamples;
        _chart.Show(samples);

        var rows = new List<RawSampleRow>(samples.Count);
        for (var index = 0; index < samples.Count; index++)
        {
            var sample = samples[index];
            rows.Add(new RawSampleRow(
                index + 1,
                $"{sample.Trim:+0.0;-0.0;0.0}°",
                $"{sample.Roll:+0.0;-0.0;0.0}°"));
        }

        RawSamplesList.ItemsSource = rows;
        RawCountLabel.Text = samples.Count == 1 ? "1 leitura" : $"{samples.Count} leituras";
        RawFooterLabel.Text = samples.Count == 0
            ? "NENHUMA LEITURA ARMAZENADA"
            : $"AMOSTRAGEM {_viewModel.Selected?.IntervalText ?? "—"} · DADOS LOCAIS";
    }

    private static void ShowOverlay(View overlay)
    {
        overlay.IsVisible = true;
        overlay.Opacity = 0;
        _ = overlay.FadeTo(1, 140, Easing.CubicOut);
    }

    private static void HideOverlay(View overlay)
    {
        if (!overlay.IsVisible)
        {
            return;
        }

        overlay.IsVisible = false;
        overlay.Opacity = 0;
    }

    private async void ShowToast(string message, ToastKind kind)
    {
        _toastCancellation?.Cancel();
        _toastCancellation?.Dispose();
        _toastCancellation = new CancellationTokenSource();
        var token = _toastCancellation.Token;

        var (background, foreground, icon) = kind switch
        {
            ToastKind.Error => (
                ResourceColor("ErrorContainer", "#93000a"),
                ResourceColor("Error", "#ffb4ab"),
                MaterialOutlined.Error),
            ToastKind.Info => (
                ResourceColor("SurfaceContainerHighest", "#2f353d"),
                ResourceColor("OnSurface", "#dde3ed"),
                MaterialOutlined.Info),
            _ => (
                ResourceColor("Primary", "#48efef"),
                ResourceColor("OnPrimary", "#003737"),
                MaterialOutlined.Check_circle),
        };

        Toast.BackgroundColor = background;
        ToastIcon.Text = icon;
        ToastIcon.TextColor = foreground;
        ToastLabel.Text = message;
        ToastLabel.TextColor = foreground;
        Toast.IsVisible = true;
        Toast.Opacity = 0;
        await Toast.FadeTo(1, 120, Easing.CubicOut);

        try
        {
            await Task.Delay(2800, token);
        }
        catch (OperationCanceledException)
        {
            return;
        }

        await Toast.FadeTo(0, 160, Easing.CubicIn);
        if (!token.IsCancellationRequested)
        {
            Toast.IsVisible = false;
        }
    }

    private static Color ResourceColor(string key, string fallback)
        => Application.Current?.Resources.TryGetValue(key, out var value) == true && value is Color color
            ? color
            : Color.FromArgb(fallback);

    private enum ToastKind
    {
        Success,
        Info,
        Error,
    }

    public sealed record RawSampleRow(int Index, string TrimText, string RollText)
    {
        public string IndexText => $"#{Index:0000}";
    }
}
