using System.ComponentModel;
using InclinationTest.Core.Models;
using InclinationTest.Core.Recording;
using InclinationTest.Core.ViewModels;

namespace InclinationTest.App.Views;

public partial class HomeView : ContentView
{
    private const double FallbackHeaderHeight = 64;

    private readonly InclinationViewModel _inclination;
    private readonly RecorderViewModel _recorder;

    public HomeView(InclinationViewModel inclination, RecorderViewModel recorder)
    {
        InitializeComponent();

        _inclination = inclination;
        _recorder = recorder;

        BindingContext = _inclination;
        TimerHost.BindingContext = _recorder;
        RecordingBar.BindingContext = _recorder;
        IdleRecord.BindingContext = _recorder;
        Chart.BindingContext = _recorder;
        SaveOverlay.BindingContext = _recorder;
        CancelOverlay.BindingContext = _recorder;

        _inclination.OnSample += OnSample;
        _inclination.PropertyChanged += OnInclinationChanged;
        _recorder.PropertyChanged += OnRecorderChanged;

        Loaded += OnLoaded;
        Unloaded += OnUnloaded;
        SizeChanged += OnSizeChanged;

        UpdateSensorChip();
        ApplyImmersive(false, animate: false);
        UpdateGaugeSize(false);
    }

    private void OnLoaded(object? sender, EventArgs e) => _inclination.Start();

    private void OnUnloaded(object? sender, EventArgs e) => _inclination.Stop();

    private void OnSample(Angles angles, double timestampMs)
        => _recorder.CaptureAngle(angles, timestampMs);

    private void OnSizeChanged(object? sender, EventArgs e)
        => UpdateGaugeSize(_recorder.IsImmersive);

    private void OnIdleRecordClicked(object? sender, EventArgs e)
        => _recorder.Record();

    private void OnToggleRequested(object? sender, EventArgs e)
        => _recorder.Toggle();

    private void OnSaveRequested(object? sender, EventArgs e)
    {
        if (string.IsNullOrWhiteSpace(_recorder.Title))
        {
            _recorder.Title = "Medição";
        }

        _recorder.RequestSave();
    }

    private void OnCancelRequested(object? sender, EventArgs e)
        => _recorder.RequestCancel();

    private void OnSaveConfirmed(object? sender, TappedEventArgs e)
    {
        if (string.IsNullOrWhiteSpace(_recorder.Title))
        {
            _recorder.Title = "Medição";
        }

        TitleEntry.Unfocus();
        _recorder.Confirm();
    }

    private void OnSaveDismissed(object? sender, TappedEventArgs e)
    {
        TitleEntry.Unfocus();
        _recorder.Dismiss();
    }

    private void OnClearTitleTapped(object? sender, TappedEventArgs e)
    {
        _recorder.Title = string.Empty;
        TitleEntry.Focus();
    }

    private void OnCancelConfirmed(object? sender, TappedEventArgs e)
    {
        _recorder.RequestCancel();
        _recorder.Confirm();
    }

    private void OnCancelDismissed(object? sender, TappedEventArgs e)
        => _recorder.Dismiss();

    private void OnSensorChipTapped(object? sender, TappedEventArgs e)
    {
        UpdateSensorChip();
        SensorPopup.IsVisible = true;
        SensorPopup.Opacity = 0;
        _ = SensorPopup.FadeTo(1, 150, Easing.CubicOut);
    }

    private void OnSensorPopupDismissed(object? sender, TappedEventArgs e)
        => _ = HideSensorPopup();

    private async Task HideSensorPopup()
    {
        await SensorPopup.FadeTo(0, 120, Easing.CubicIn);
        SensorPopup.IsVisible = false;
    }

    private void OnRecorderChanged(object? sender, PropertyChangedEventArgs e)
    {
        switch (e.PropertyName)
        {
            case nameof(RecorderViewModel.IsImmersive):
                ApplyImmersive(_recorder.IsImmersive, animate: true);
                break;
            case nameof(RecorderViewModel.Confirmation):
                ApplyConfirmation(_recorder.Confirmation);
                break;
        }
    }

    private void ApplyConfirmation(ConfirmationRequest request)
    {
        if (request == ConfirmationRequest.None)
        {
            SaveOverlay.IsVisible = false;
            CancelOverlay.IsVisible = false;
            return;
        }

        if (request == ConfirmationRequest.Save)
        {
            CancelOverlay.IsVisible = false;
            ShowOverlay(SaveOverlay);
            TitleEntry.Focus();
            return;
        }

        SaveOverlay.IsVisible = false;
        ShowOverlay(CancelOverlay);
    }

    private static void ShowOverlay(View overlay)
    {
        overlay.IsVisible = true;
        overlay.Opacity = 0;
        _ = overlay.FadeTo(1, 160, Easing.CubicOut);
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
        var hasError = !string.IsNullOrWhiteSpace(_inclination.Error);
        var calibrated = _inclination.IsCalibrated;
        var color = hasError
            ? ResourceColor("Error", "#ffb4ab")
            : calibrated
                ? ResourceColor("Primary", "#48efef")
                : ResourceColor("Outline", "#859493");

        SensorChipLabel.Text = hasError ? "ERRO" : calibrated ? "CALIBRADO" : "NÃO CALIBRADO";
        SensorChipLabel.TextColor = color;
        StatusDot.Fill = new SolidColorBrush(color);
        SensorPopupStatus.Text = hasError
            ? $"Erro: {_inclination.Error}"
            : calibrated
                ? "Status: calibrado"
                : "Status: não calibrado";
        SensorPopupStatus.TextColor = color;
    }

    private void ApplyImmersive(bool immersive, bool animate)
    {
        Chart.IsVisible = immersive;

        if (!animate)
        {
            Header.IsVisible = true;
            Header.TranslationY = 0;
            Header.Opacity = 1;

            TimerHost.IsVisible = immersive;
            TimerHost.TranslationY = 0;
            TimerHost.Opacity = immersive ? 1 : 0;

            IdleRecord.IsVisible = !immersive;
            IdleRecord.Opacity = immersive ? 0 : 1;

            RecordingBar.IsVisible = immersive;
            RecordingBar.TranslationY = 0;
            RecordingBar.Opacity = immersive ? 1 : 0;

            ContentHost.Padding = immersive
                ? new Thickness(16, 0, 16, 0)
                : new Thickness(20, 4, 20, 4);
            UpdateGaugeSize(immersive);
            return;
        }

        UpdateGaugeSize(immersive);

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

        ContentHost.Padding = new Thickness(16, 0, 16, 0);
        TimerHost.IsVisible = true;
        TimerHost.TranslationY = -12;
        TimerHost.Opacity = 0;

        RecordingBar.IsVisible = true;
        RecordingBar.TranslationY = 24;
        RecordingBar.Opacity = 0;

        IdleRecord.IsVisible = false;

        Chart.Opacity = 0;
        await Task.WhenAll(
            Header.FadeTo(0, 200, Easing.CubicInOut),
            Header.TranslateTo(0, -height, 200, Easing.CubicInOut),
            TimerHost.FadeTo(1, 200, Easing.CubicInOut),
            TimerHost.TranslateTo(0, 0, 200, Easing.CubicInOut),
            RecordingBar.FadeTo(1, 220, Easing.CubicInOut),
            RecordingBar.TranslateTo(0, 0, 220, Easing.CubicInOut),
            Chart.FadeTo(1, 220, Easing.CubicInOut));

        Header.IsVisible = false;
    }

    private async void ExitImmersive()
    {
        var height = Header.Height > 0 ? Header.Height : FallbackHeaderHeight;

        Header.IsVisible = true;
        Header.TranslationY = -height;
        Header.Opacity = 0;

        await Task.WhenAll(
            TimerHost.FadeTo(0, 200, Easing.CubicInOut),
            TimerHost.TranslateTo(0, -12, 200, Easing.CubicInOut),
            RecordingBar.FadeTo(0, 200, Easing.CubicInOut),
            RecordingBar.TranslateTo(0, 24, 200, Easing.CubicInOut),
            Chart.FadeTo(0, 160, Easing.CubicIn),
            Header.FadeTo(1, 200, Easing.CubicInOut),
            Header.TranslateTo(0, 0, 200, Easing.CubicInOut));

        TimerHost.IsVisible = false;
        RecordingBar.IsVisible = false;
        Chart.IsVisible = false;

        ContentHost.Padding = new Thickness(20, 4, 20, 4);
        IdleRecord.IsVisible = true;
        IdleRecord.Opacity = 0;
        await IdleRecord.FadeTo(1, 160, Easing.CubicInOut);
    }

    private void UpdateGaugeSize(bool immersive)
    {
        var width = RootView.Width > 0 ? RootView.Width : 360;
        var size = immersive
            ? Math.Min(width * 0.76, 360)
            : Math.Min(width * 0.90, 420);

        Gauge.Size = Math.Max(size, 210);
    }

    private static Color ResourceColor(string key, string fallback)
        => Application.Current?.Resources.TryGetValue(key, out var value) == true && value is Color color
            ? color
            : Color.FromArgb(fallback);
}
