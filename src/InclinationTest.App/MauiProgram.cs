using InclinationTest.App.Sensors;
using InclinationTest.App.Views;
using InclinationTest.Core.Processing;
using InclinationTest.Core.Sensors;
using InclinationTest.Core.ViewModels;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Maui.Hosting;

namespace InclinationTest.App;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder.UseMauiApp<App>();

        builder.Services.AddSingleton<IAccelerometerSource, MauiAccelerometerSource>();
        builder.Services.AddSingleton<ISensorService>(
            provider => new SensorService(provider.GetRequiredService<IAccelerometerSource>()));
        builder.Services.AddSingleton<IFilter>(_ => FilterService.Create());
        builder.Services.AddSingleton<InclinationViewModel>();
        builder.Services.AddSingleton<Views.HomePage>();

#if DEBUG
        builder.Logging.AddDebug();
#endif

        return builder.Build();
    }
}
