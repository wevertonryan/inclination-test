using System.ComponentModel;
using InclinationTest.Core.ViewModels;
using UraniumUI.Icons.MaterialSymbols;

namespace InclinationTest.App.Views;

public partial class CalibragemView : ContentView
{
    private readonly InclinationViewModel _inclination;

    public CalibragemView(InclinationViewModel inclination)
    {
        InitializeComponent();

        _inclination = inclination;
        _inclination.PropertyChanged += OnInclinationChanged;

        Loaded += OnLoaded;
        Unloaded += OnUnloaded;

        UpdateAccelerometerStatus();
    }

    private void OnLoaded(object? sender, EventArgs e) => _inclination.Start();

    private void OnUnloaded(object? sender, EventArgs e) => _inclination.Stop();

    private void OnInclinationChanged(object? sender, PropertyChangedEventArgs e)
    {
        if (e.PropertyName is nameof(InclinationViewModel.IsCalibrated)
            or nameof(InclinationViewModel.Error))
        {
            UpdateAccelerometerStatus();
        }
    }

    private void UpdateAccelerometerStatus()
    {
        var hasError = !string.IsNullOrWhiteSpace(_inclination.Error);
        var calibrated = _inclination.IsCalibrated;
        var color = hasError
            ? ResourceColor("Error", "#ffb4ab")
            : calibrated
                ? ResourceColor("Primary", "#48efef")
                : ResourceColor("Outline", "#859493");

        AccelStatusIcon.Text = hasError
            ? MaterialOutlined.Error
            : calibrated
                ? MaterialOutlined.Check_circle
                : MaterialOutlined.Help;
        AccelStatusIcon.TextColor = color;
    }

    private async void OnCalibrateTapped(object? sender, TappedEventArgs e)
    {
        if (!string.IsNullOrWhiteSpace(_inclination.Error))
        {
            ShowPopover(
                "Acelerômetro",
                "O sensor não está disponível. Verifique a conexão e tente novamente.",
                MaterialOutlined.Error,
                ResourceColor("Error", "#ffb4ab"));
            return;
        }

        _inclination.Calibrate();
        UpdateAccelerometerStatus();

        var fab = (View)sender!;
        await fab.ScaleTo(0.92, 90, Easing.CubicOut);
        await fab.ScaleTo(1, 110, Easing.CubicIn);
    }

    private void OnAccelerometerTapped(object? sender, TappedEventArgs e)
    {
        var calibrated = _inclination.IsCalibrated;
        var hasError = !string.IsNullOrWhiteSpace(_inclination.Error);

        ShowPopover(
            "Acelerômetro",
            hasError
                ? $"Erro: {_inclination.Error}"
                : calibrated
                    ? "Sensor calibrado. A posição atual foi usada como referência zero."
                    : "Sensor disponível, mas ainda não calibrado. Use o botão de calibragem.",
            hasError ? MaterialOutlined.Error : calibrated ? MaterialOutlined.Check_circle : MaterialOutlined.Help,
            hasError
                ? ResourceColor("Error", "#ffb4ab")
                : calibrated
                    ? ResourceColor("Primary", "#48efef")
                    : ResourceColor("Outline", "#859493"));
    }

    private void OnUnsupportedSensorTapped(object? sender, TappedEventArgs e)
    {
        var name = e.Parameter as string ?? "Sensor";

        ShowPopover(
            name,
            $"{name}: sensor não identificado neste build. Nenhuma leitura está disponível.",
            MaterialOutlined.Help,
            ResourceColor("Outline", "#859493"));
    }

    private void ShowPopover(string title, string description, string icon, Color color)
    {
        PopoverTitle.Text = title;
        PopoverDescription.Text = description;
        PopoverIcon.Text = icon;
        PopoverIcon.TextColor = color;
        StatusPopover.IsVisible = true;
        StatusPopover.Opacity = 0;
        _ = StatusPopover.FadeTo(1, 140, Easing.CubicOut);
    }

    private void OnPopoverDismissed(object? sender, TappedEventArgs e)
        => _ = HidePopover();

    private async Task HidePopover()
    {
        await StatusPopover.FadeTo(0, 110, Easing.CubicIn);
        StatusPopover.IsVisible = false;
    }

    private static Color ResourceColor(string key, string fallback)
        => Application.Current?.Resources.TryGetValue(key, out var value) == true && value is Color color
            ? color
            : Color.FromArgb(fallback);
}
