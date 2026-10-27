using UraniumUI.Icons.MaterialSymbols;

namespace InclinationTest.App.Components.Features;

public partial class RecordingBar : ContentView
{
    public RecordingBar()
    {
        InitializeComponent();

        CancelIcon.Text = MaterialOutlined.Close;
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
