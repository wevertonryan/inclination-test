namespace InclinationTest.App;

public partial class App : Application
{
    private readonly Views.HomePage _homePage;

    public App(Views.HomePage homePage)
    {
        InitializeComponent();
        _homePage = homePage;
    }

    protected override Window CreateWindow(IActivationState? activationState) => new Window(_homePage);
}
