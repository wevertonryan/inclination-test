using InclinationTest.Core.ViewModels;
using UraniumUI.Icons.MaterialSymbols;

namespace InclinationTest.App.Components.Features;

public partial class RecordButton : ContentView
{
    public static readonly BindableProperty ModeProperty = BindableProperty.Create(
        nameof(Mode),
        typeof(RecorderMode),
        typeof(RecordButton),
        RecorderMode.Idle,
        propertyChanged: OnModeChanged);

    public RecordButton()
    {
        InitializeComponent();
        Icon.FontFamily = "MaterialOutlined";
        Icon.FontSize = 26;
        UpdateVisual();
    }

    public event EventHandler? Clicked;

    public RecorderMode Mode
    {
        get => (RecorderMode)GetValue(ModeProperty);
        set => SetValue(ModeProperty, value);
    }

    private static void OnModeChanged(BindableObject bindable, object oldValue, object newValue)
        => ((RecordButton)bindable).UpdateVisual();

    private void OnTapped(object? sender, TappedEventArgs e)
        => Clicked?.Invoke(this, EventArgs.Empty);

    private void UpdateVisual()
    {
        var idle = Mode == RecorderMode.Idle;

        Core.IsVisible = idle;
        Icon.IsVisible = !idle;
        Icon.Text = Mode == RecorderMode.Recording ? MaterialOutlined.Pause : MaterialOutlined.Play_arrow;
    }
}
