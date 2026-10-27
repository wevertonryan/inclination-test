using System.ComponentModel;
using InclinationTest.Core.ViewModels;
using UraniumUI.Icons.MaterialSymbols;
using UraniumUI.Material.Controls;

namespace InclinationTest.App.Views;

public partial class MainPage : ContentPage
{
    private readonly RecorderViewModel _recorder;
    private readonly ReportsViewModel _reports;

    public MainPage(
        RecorderViewModel recorder,
        ReportsViewModel reports,
        HomeView home,
        CalibragemView calibragem,
        RelatoriosView relatorios,
        TestesView testes,
        ConfiguracoesView configuracoes)
    {
        InitializeComponent();

        _recorder = recorder;
        _reports = reports;

        BindingContext = recorder;

        AddTab(home, "Medição", MaterialOutlined.Explore);
        AddTab(calibragem, "Calibragem", MaterialOutlined.Straighten);
        AddTab(relatorios, "Relatórios", MaterialOutlined.Description);
        AddTab(testes, "Testes", MaterialOutlined.Science);
        AddTab(configuracoes, "Ajustes", MaterialOutlined.Settings);

        MainTabView.SizeChanged += OnTabViewSizeChanged;

        _recorder.PropertyChanged += OnRecorderChanged;
        _reports.PropertyChanged += OnReportsChanged;

        UpdateChrome();
    }

    private void OnTabViewSizeChanged(object? sender, EventArgs e)
        => DistributeTabsEvenly();

    private void OnRecorderChanged(object? sender, PropertyChangedEventArgs e)
    {
        if (e.PropertyName == nameof(RecorderViewModel.IsImmersive))
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
        => MainTabView.HeaderVisible = !_recorder.IsImmersive && !_reports.HasSelection;

    private void DistributeTabsEvenly()
    {
        if (MainTabView.Width <= 0 || MainTabView.Tabs.Count == 0)
        {
            return;
        }

        var itemWidth = MainTabView.Width / MainTabView.Tabs.Count;
        if (!MainTabView.TabHeaderItemColumnWidth.IsAbsolute
            || Math.Abs(MainTabView.TabHeaderItemColumnWidth.Value - itemWidth) > 0.5)
        {
            MainTabView.TabHeaderItemColumnWidth = new GridLength(itemWidth);
        }
    }

    private void AddTab(View content, string title, string glyph)
        => MainTabView.Tabs.Add(new TabItem { Content = content, Title = title, Data = glyph });
}
