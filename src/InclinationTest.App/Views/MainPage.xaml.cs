using UraniumUI.Icons.MaterialSymbols;
using UraniumUI.Material.Controls;

namespace InclinationTest.App.Views;

public partial class MainPage : ContentPage
{
    public MainPage(
        HomeView home,
        CalibragemView calibragem,
        RelatoriosView relatorios,
        TestesView testes,
        ConfiguracoesView configuracoes)
    {
        InitializeComponent();

        AddTab(home, "Home", MaterialOutlined.Home);
        AddTab(calibragem, "Calibragem", MaterialOutlined.Tune);
        AddTab(relatorios, "Relatórios", MaterialOutlined.Description);
        AddTab(testes, "Testes", MaterialOutlined.Science);
        AddTab(configuracoes, "Configurações", MaterialOutlined.Settings);

        MainTabView.SizeChanged += OnTabViewSizeChanged;
    }

    private void OnTabViewSizeChanged(object? sender, EventArgs e)
        => DistributeTabsEvenly();

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
