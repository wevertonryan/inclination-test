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

        if (idle)
        {
            Glow.BackgroundColor = Color.FromArgb("#26ffb4ab");
            Circle.BackgroundColor = ResourceColor("SurfaceContainerLowest", "#090f16");
            Inner.BackgroundColor = Color.FromArgb("#66ffb4ab");
            return;
        }

        Glow.BackgroundColor = Color.FromArgb("#2648efef");
        Circle.BackgroundColor = ResourceColor("SurfaceContainerLowest", "#090f16");

        if (Mode == RecorderMode.Recording)
        {
            Inner.BackgroundColor = ResourceColor("PrimaryContainer", "#00d2d3");
            Icon.Text = MaterialOutlined.Pause;
            Icon.TextColor = ResourceColor("OnPrimaryContainer", "#005556");
        }
        else
        {
            Inner.BackgroundColor = ResourceColor("TertiaryContainer", "#ffab32");
            Icon.Text = MaterialOutlined.Play_arrow;
            Icon.TextColor = ResourceColor("OnTertiaryContainer", "#6c4300");
        }
    }

    private static Color ResourceColor(string key, string fallback)
        => Application.Current?.Resources.TryGetValue(key, out var value) == true && value is Color color
            ? color
            : Color.FromArgb(fallback);
}
