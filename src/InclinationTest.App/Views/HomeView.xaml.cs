using System.ComponentModel;
using InclinationTest.Core.ViewModels;

namespace InclinationTest.App.Views;

public partial class HomeView : ContentView
{
    private readonly InclinationViewModel _viewModel;

    public HomeView(InclinationViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = _viewModel = viewModel;

        _viewModel.PropertyChanged += OnViewModelPropertyChanged;
        Loaded += OnLoaded;
        Unloaded += OnUnloaded;
    }

    private void OnLoaded(object? sender, EventArgs e) => _viewModel.Start();

    private void OnUnloaded(object? sender, EventArgs e) => _viewModel.Stop();

    private void OnIniciarClicked(object? sender, EventArgs e) => _viewModel.Start();

    private void OnPararClicked(object? sender, EventArgs e) => _viewModel.Stop();

    private void OnCalibrarClicked(object? sender, EventArgs e) => _viewModel.Calibrate();

    private void OnViewModelPropertyChanged(object? sender, PropertyChangedEventArgs e)
    {
        if (e.PropertyName == nameof(InclinationViewModel.Error))
        {
            ErrorLabel.IsVisible = !string.IsNullOrEmpty(_viewModel.Error);
        }
    }
}
