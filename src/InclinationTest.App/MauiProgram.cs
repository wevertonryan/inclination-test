using InclinationTest.App.Sensors;
using InclinationTest.App.Views;
using InclinationTest.Core.Processing;
using InclinationTest.Core.Sensors;
using InclinationTest.Core.ViewModels;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Maui.Hosting;
using SkiaSharp.Views.Maui.Controls.Hosting;
using UraniumUI;

namespace InclinationTest.App;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .UseSkiaSharp()
            .UseUraniumUI()
            .UseUraniumUIMaterial()
            .ConfigureFonts(fonts => fonts.AddMaterialSymbolsFonts());

        builder.Services.AddSingleton<IAccelerometerSource, MauiAccelerometerSource>();
        builder.Services.AddSingleton<ISensorService>(
            provider => new SensorService(provider.GetRequiredService<IAccelerometerSource>()));
        builder.Services.AddSingleton<IFilter>(_ => FilterService.Create());
        builder.Services.AddSingleton<InclinationViewModel>();

        builder.Services.AddSingleton<AppShell>();
        builder.Services.AddSingleton<MainPage>();
        builder.Services.AddSingleton<HomeView>();
        builder.Services.AddSingleton<CalibragemView>();
        builder.Services.AddSingleton<RelatoriosView>();
        builder.Services.AddSingleton<TestesView>();
        builder.Services.AddSingleton<ConfiguracoesView>();

#if DEBUG
        builder.Logging.AddDebug();
#endif

        return builder.Build();
    }
}
