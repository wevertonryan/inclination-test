using System.ComponentModel;
using InclinationTest.App.Components.Features;
using InclinationTest.Core.Recording;
using InclinationTest.Core.ViewModels;
using Microsoft.Maui.ApplicationModel;

namespace InclinationTest.App.Views;

public partial class RelatoriosView : ContentView
{
    private readonly ReportsViewModel _viewModel;
    private readonly ReportChartView _chart = new();

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
            _chart.Show(_viewModel.SelectedSamples);
        }
    }

    private void OnReportSelected(object? sender, SelectionChangedEventArgs e)
    {
        if (e.CurrentSelection.FirstOrDefault() is not ReportItem item)
        {
            return;
        }

        ReportsList.SelectedItem = null;
        _viewModel.Open(item);
    }

    private void OnBackClicked(object? sender, EventArgs e) => _viewModel.Close();
}
