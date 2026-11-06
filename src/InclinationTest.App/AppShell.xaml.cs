using InclinationTest.App.Views;

namespace InclinationTest.App;

public partial class AppShell : Shell
{
    public AppShell(MainPage mainPage)
    {
        InitializeComponent();
        BackgroundColor = Color.FromArgb("#0e141b");
        MainContent.BackgroundColor = Color.FromArgb("#0e141b");
        MainContent.Content = mainPage;
    }
}
