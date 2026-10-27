using Android.App;
using Android.Content.PM;
using Android.OS;
using Android.Views;
using Microsoft.Maui;

namespace InclinationTest.App;

[Activity(
    Theme = "@style/Maui.SplashTheme",
    MainLauncher = true,
    ConfigurationChanges = ConfigChanges.ScreenSize
        | ConfigChanges.Orientation
        | ConfigChanges.UiMode
        | ConfigChanges.ScreenLayout
        | ConfigChanges.SmallestScreenSize
        | ConfigChanges.Density)]
public class MainActivity : MauiAppCompatActivity
{
    protected override void OnCreate(Bundle? savedInstanceState)
    {
        base.OnCreate(savedInstanceState);

        if (Window is null)
        {
            return;
        }

        if (!OperatingSystem.IsAndroidVersionAtLeast(35))
        {
            Window.SetStatusBarColor(Android.Graphics.Color.ParseColor("#0e141b"));
            Window.SetNavigationBarColor(Android.Graphics.Color.ParseColor("#0e141b"));
        }

        if (OperatingSystem.IsAndroidVersionAtLeast(30) && Window.InsetsController is { } controller)
        {
            controller.SetSystemBarsAppearance(
                0,
                (int)(WindowInsetsControllerAppearance.LightStatusBars
                    | WindowInsetsControllerAppearance.LightNavigationBars));
        }
    }
}
