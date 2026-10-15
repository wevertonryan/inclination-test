using UraniumUI.Icons.MaterialSymbols;

namespace InclinationTest.App.Components.Features;

public partial class RecordingBar : ContentView
{
    public RecordingBar()
    {
        InitializeComponent();

        CancelIcon.FontFamily = "MaterialOutlined";
        CancelIcon.FontSize = 26;
        CancelIcon.Text = MaterialOutlined.Close;

        SaveIcon.FontFamily = "MaterialOutlined";
        SaveIcon.FontSize = 26;
        SaveIcon.Text = MaterialOutlined.Check;
    }

    public event EventHandler? CancelRequested;

    public event EventHandler? SaveRequested;

    public event EventHandler? ToggleRequested;

    private void OnCancel(object? sender, TappedEventArgs e)
        => CancelRequested?.Invoke(this, EventArgs.Empty);

    private void OnSave(object? sender, TappedEventArgs e)
        => SaveRequested?.Invoke(this, EventArgs.Empty);

    private void OnToggle(object? sender, EventArgs e)
        => ToggleRequested?.Invoke(this, EventArgs.Empty);
}
