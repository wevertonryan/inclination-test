using InclinationTest.App.Views;

namespace InclinationTest.App;

public partial class AppShell : Shell
{
    public AppShell(MainPage mainPage)
    {
        InitializeComponent();
        MainContent.Content = mainPage;
    }
}
