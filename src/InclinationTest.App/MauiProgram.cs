using InclinationTest.App.Platform;
using InclinationTest.App.Sensors;
using InclinationTest.App.Views;
using InclinationTest.Core.Persistence;
using InclinationTest.Core.Platform;
using InclinationTest.Core.Processing;
using InclinationTest.Core.Recording;
using InclinationTest.Core.Sensors;
using InclinationTest.Core.ViewModels;
using LiveChartsCore.SkiaSharpView.Maui;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Maui.Dispatching;
using Microsoft.Maui.Hosting;
using SkiaSharp.Views.Maui.Controls.Hosting;
using UraniumUI;

namespace InclinationTest.App;

public static class MauiProgram
{
    /// <summary>
    /// O sensor entrega ~50 Hz; a tela (inclinômetro, rótulos, gráfico) repinta a ~15 Hz.
    /// A gravação continua recebendo todas as amostras via <c>OnSample</c>.
    /// </summary>
    private const int UiPublishIntervalMs = 66;

    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .UseSkiaSharp()
            .UseLiveCharts()
            .UseUraniumUI()
            .UseUraniumUIMaterial()
            .ConfigureFonts(fonts => fonts.AddMaterialSymbolsFonts());

        builder.Services.AddSingleton<IAccelerometerSource, MauiAccelerometerSource>();
        builder.Services.AddSingleton<ISensorService>(
            provider => new SensorService(provider.GetRequiredService<IAccelerometerSource>()));
        builder.Services.AddSingleton<IFilter>(_ => FilterService.Create());
        builder.Services.AddSingleton<InclinationViewModel>(
            provider => new InclinationViewModel(
                provider.GetRequiredService<ISensorService>(),
                provider.GetRequiredService<IFilter>(),
                UiPublishIntervalMs));

        builder.Services.AddSingleton<IClock, SystemClock>();
        builder.Services.AddSingleton<ITicker>(_ => new DispatcherTicker(
            Application.Current?.Dispatcher ?? Dispatcher.GetForCurrentThread()!));
        builder.Services.AddSingleton<ISerialExecutor, ThreadSerialExecutor>();
        builder.Services.AddSingleton<IRecordingSession, RecordingSession>();
        builder.Services.AddSingleton<IReportStorage, AppDataReportStorage>();
        builder.Services.AddSingleton<IReportRepository, FileReportRepository>();
        builder.Services.AddSingleton<ReportsViewModel>();
        builder.Services.AddSingleton<RecordingWriter>();
        builder.Services.AddSingleton<RecorderViewModel>(provider =>
        {
            _ = provider.GetRequiredService<RecordingWriter>();

            return new RecorderViewModel(
                provider.GetRequiredService<IRecordingSession>(),
                provider.GetRequiredService<ITicker>(),
                provider.GetRequiredService<IClock>());
        });

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
