using System.ComponentModel;
using InclinationTest.Core.Recording;
using InclinationTest.Core.ViewModels;
using Microsoft.Maui.ApplicationModel;
using UraniumUI.Icons.MaterialSymbols;
using UraniumUI.Material.Controls;

namespace InclinationTest.App.Views;

public partial class MainPage : ContentPage
{
    private readonly RecorderViewModel _recorder;
    private readonly ReportsViewModel _reports;
    private readonly RecordingWriter _writer;
    private TabItem _relatoriosTab;

    public MainPage(
        RecorderViewModel recorder,
        ReportsViewModel reports,
        RecordingWriter writer,
        HomeView home,
        CalibragemView calibragem,
        RelatoriosView relatorios,
        ConfiguracoesView configuracoes)
    {
        InitializeComponent();

        _recorder = recorder;
        _reports = reports;
        _writer = writer;

        BindingContext = recorder;

        _writer.Saved += OnRecordingSaved;

        AddTab(home, "Medição", MaterialOutlined.Explore);
        AddTab(calibragem, "Calibragem", MaterialOutlined.Straighten);
        _relatoriosTab = AddTab(relatorios, "Relatórios", MaterialOutlined.Description);
        AddTab(configuracoes, "Conta", MaterialOutlined.Person);

        MainTabView.SizeChanged += OnTabViewSizeChanged;

        _recorder.PropertyChanged += OnRecorderChanged;
        _reports.PropertyChanged += OnReportsChanged;

        UpdateChrome();
    }

    private void OnRecordingSaved(string recordingId)
        => MainThread.BeginInvokeOnMainThread(() =>
        {
            _reports.Refresh();
            MainTabView.SelectedTab = _relatoriosTab;
        });

    private void OnTabViewSizeChanged(object? sender, EventArgs e)
        => DistributeTabsEvenly();

    private void OnRecorderChanged(object? sender, PropertyChangedEventArgs e)
    {
        if (e.PropertyName == nameof(RecorderViewModel.State))
        {
            UpdateChrome();
        }
    }

    private void OnReportsChanged(object? sender, PropertyChangedEventArgs e)
    {
        if (e.PropertyName == nameof(ReportsViewModel.HasSelection))
        {
            UpdateChrome();
        }
    }

    private void UpdateChrome()
    {
        var recording = _recorder.State is RecorderMode.Recording or RecorderMode.Paused;
        var detailOpen = _reports.HasSelection;
        var hideTabs = recording || detailOpen;

        MainTabView.TabHeaderPosition = hideTabs ? TabPosition.None : TabPosition.Bottom;
    }

    private TabItem AddTab(View content, string title, string iconGlyph)
    {
        var item = new TabItem
        {
            Title = title,
            Icon = new FontImageSource
            {
                Glyph = iconGlyph,
                FontFamily = "MaterialOutlined",
                Size = 22,
            },
            Content = content,
        };

        MainTabView.Items.Add(item);
        return item;
    }

    private void DistributeTabsEvenly()
    {
        var totalWidth = MainTabView.Width;
        var tabCount = MainTabView.Items.Count;
        if (totalWidth <= 0 || tabCount == 0)
        {
            return;
        }

        var widthPerTab = totalWidth / tabCount;
        foreach (var tab in MainTabView.Items)
        {
            tab.WidthRequest = widthPerTab;
        }
    }
}
