using System.ComponentModel;
using InclinationTest.Core.ViewModels;

namespace InclinationTest.App.Views;

public partial class HomePage : ContentPage
{
    private readonly InclinationViewModel _viewModel;

    public HomePage(InclinationViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = _viewModel = viewModel;

        _viewModel.PropertyChanged += OnViewModelPropertyChanged;
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        _viewModel.Start();
    }

    protected override void OnDisappearing()
    {
        _viewModel.PropertyChanged -= OnViewModelPropertyChanged;
        base.OnDisappearing();
    }

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
