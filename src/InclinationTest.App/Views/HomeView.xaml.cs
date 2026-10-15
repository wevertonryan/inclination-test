using System.ComponentModel;
using InclinationTest.Core.Models;
using InclinationTest.Core.ViewModels;

namespace InclinationTest.App.Views;

public partial class HomeView : ContentView
{
    private const double FallbackHeaderHeight = 56;

    private readonly InclinationViewModel _inclination;
    private readonly RecorderViewModel _recorder;

    public HomeView(InclinationViewModel inclination, RecorderViewModel recorder)
    {
        InitializeComponent();

        _inclination = inclination;
        _recorder = recorder;

        BindingContext = _inclination;
        TimerPill.BindingContext = _recorder;
        RecordingBar.BindingContext = _recorder;
        IdleRecord.BindingContext = _recorder;
        Chart.BindingContext = _recorder;

        _inclination.OnSample += OnSample;
        _inclination.PropertyChanged += OnInclinationChanged;
        _recorder.PropertyChanged += OnRecorderChanged;

        Loaded += OnLoaded;
        Unloaded += OnUnloaded;

        UpdateSensorChip();
        ApplyImmersive(false, animate: false);
    }

    private void OnLoaded(object? sender, EventArgs e) => _inclination.Start();

    private void OnUnloaded(object? sender, EventArgs e) => _inclination.Stop();

    private void OnSample(Angles angles, double timestampMs)
        => _recorder.CaptureAngle(angles, timestampMs);

    private void OnIdleRecordClicked(object? sender, EventArgs e)
        => _recorder.Record();

    private void OnToggleRequested(object? sender, EventArgs e)
        => _recorder.Toggle();

    private async void OnSaveRequested(object? sender, EventArgs e)
    {
        var title = await Shell.Current.DisplayPromptAsync(
            "Salvar relatório",
            "Informe um nome para o relatório",
            "Salvar",
            "Cancelar",
            "Medição");

        if (string.IsNullOrWhiteSpace(title))
        {
            _recorder.Dismiss();
            return;
        }

        _recorder.Title = title.Trim();
        _recorder.RequestSave();
        _recorder.Confirm();
    }

    private async void OnCancelRequested(object? sender, EventArgs e)
    {
        var confirm = await Shell.Current.DisplayAlert(
            "Descartar gravação",
            "Deseja descartar esta gravação?",
            "Descartar",
            "Continuar");

        if (!confirm)
        {
            _recorder.Dismiss();
            return;
        }

        _recorder.RequestCancel();
        _recorder.Confirm();
    }

    private void OnRecorderChanged(object? sender, PropertyChangedEventArgs e)
    {
        if (e.PropertyName == nameof(RecorderViewModel.IsImmersive))
        {
            ApplyImmersive(_recorder.IsImmersive, animate: true);
        }
    }

    private void OnInclinationChanged(object? sender, PropertyChangedEventArgs e)
    {
        if (e.PropertyName == nameof(InclinationViewModel.Error))
        {
            ErrorLabel.IsVisible = !string.IsNullOrEmpty(_inclination.Error);
        }

        if (e.PropertyName is nameof(InclinationViewModel.IsCalibrated)
            or nameof(InclinationViewModel.Error))
        {
            UpdateSensorChip();
        }
    }

    private void UpdateSensorChip()
    {
        var calibrated = _inclination.IsCalibrated;
        var color = calibrated ? Color.FromArgb("#34c98a") : Color.FromArgb("#8b98b4");

        SensorChipLabel.Text = calibrated ? "CALIBRADO" : "NÃO CALIBRADO";
        SensorChipLabel.TextColor = color;
        SensorChip.Stroke = new SolidColorBrush(color);
    }

    private void ApplyImmersive(bool immersive, bool animate)
    {
        if (!animate)
        {
            Header.IsVisible = true;
            Header.TranslationY = 0;
            Header.Opacity = 1;

            TimerPill.IsVisible = immersive;
            TimerPill.TranslationY = 0;
            TimerPill.Opacity = immersive ? 1 : 0;

            IdleRecord.IsVisible = !immersive;
            IdleRecord.Opacity = immersive ? 0 : 1;

            RecordingBar.IsVisible = immersive;
            RecordingBar.TranslationY = 0;
            RecordingBar.Opacity = immersive ? 1 : 0;
            return;
        }

        if (immersive)
        {
            EnterImmersive();
        }
        else
        {
            ExitImmersive();
        }
    }

    private async void EnterImmersive()
    {
        var height = Header.Height > 0 ? Header.Height : FallbackHeaderHeight;

        TimerPill.IsVisible = true;
        TimerPill.TranslationY = -12;
        TimerPill.Opacity = 0;

        RecordingBar.IsVisible = true;
        RecordingBar.TranslationY = 24;
        RecordingBar.Opacity = 0;

        IdleRecord.IsVisible = false;

        await Task.WhenAll(
            Header.FadeTo(0, 200, Easing.CubicInOut),
            Header.TranslateTo(0, -height, 200, Easing.CubicInOut),
            TimerPill.FadeTo(1, 200, Easing.CubicInOut),
            TimerPill.TranslateTo(0, 0, 200, Easing.CubicInOut),
            RecordingBar.FadeTo(1, 220, Easing.CubicInOut),
            RecordingBar.TranslateTo(0, 0, 220, Easing.CubicInOut));

        Header.IsVisible = false;
    }

    private async void ExitImmersive()
    {
        var height = Header.Height > 0 ? Header.Height : FallbackHeaderHeight;

        Header.IsVisible = true;
        Header.TranslationY = -height;
        Header.Opacity = 0;

        await Task.WhenAll(
            TimerPill.FadeTo(0, 200, Easing.CubicInOut),
            TimerPill.TranslateTo(0, -12, 200, Easing.CubicInOut),
            RecordingBar.FadeTo(0, 200, Easing.CubicInOut),
            RecordingBar.TranslateTo(0, 24, 200, Easing.CubicInOut),
            Header.FadeTo(1, 200, Easing.CubicInOut),
            Header.TranslateTo(0, 0, 200, Easing.CubicInOut));

        TimerPill.IsVisible = false;
        RecordingBar.IsVisible = false;

        IdleRecord.IsVisible = true;
        IdleRecord.Opacity = 0;
        await IdleRecord.FadeTo(1, 160, Easing.CubicInOut);
    }
}
