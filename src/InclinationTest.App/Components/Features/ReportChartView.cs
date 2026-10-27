using InclinationTest.Core.Recording;
using LiveChartsCore;
using LiveChartsCore.Defaults;
using LiveChartsCore.Measure;
using LiveChartsCore.SkiaSharpView;
using LiveChartsCore.SkiaSharpView.Maui;
using LiveChartsCore.SkiaSharpView.Painting;
using SkiaSharp;

namespace InclinationTest.App.Components.Features;

/// <summary>
/// Gráfico de um relatório já salvo. Diferente do <see cref="ChartView"/> (streaming), aqui a
/// série é montada uma única vez, quando o relatório é aberto, e decimada se for muito longa.
/// </summary>
public sealed class ReportChartView : ContentView
{
    private const int MaxPoints = 900;
    private const double ScaleFloor = 5;

    private readonly CartesianChart _chart;
    private readonly Axis _yAxis;

    public ReportChartView()
    {
        _yAxis = new Axis
        {
            MinLimit = -ScaleFloor,
            MaxLimit = ScaleFloor,
            MinStep = ScaleFloor,
            TextSize = 9,
            Labeler = value => $"{value:0}°",
            LabelsPaint = new SolidColorPaint(ThemeColor("OnSurfaceVariant", "#bacac9")),
            SeparatorsPaint = new SolidColorPaint(ThemeColor("SurfaceContainerHighest", "#2f353d"), 1),
        };

        _chart = new CartesianChart
        {
            Series = Array.Empty<ISeries>(),
            XAxes = new[]
            {
                new Axis
                {
                    MinLimit = 0,
                    TextSize = 9,
                    Labeler = seconds => $"{seconds:0}s",
                    LabelsPaint = new SolidColorPaint(ThemeColor("OnSurfaceVariant", "#bacac9")),
                    SeparatorsPaint = new SolidColorPaint(ThemeColor("SurfaceContainerHighest", "#2f353d"), 1),
                },
            },
            YAxes = new[] { _yAxis },
            LegendPosition = LegendPosition.Hidden,
            TooltipPosition = TooltipPosition.Hidden,
            AnimationsSpeed = TimeSpan.Zero,
            EasingFunction = null,
            BackgroundColor = Colors.Transparent,
        };

        Content = _chart;
        HeightRequest = 200;
    }

    public void Show(IReadOnlyList<RecordedSample> samples)
    {
        if (samples.Count == 0)
        {
            _chart.Series = Array.Empty<ISeries>();
            return;
        }

        var step = Math.Max(1, (int)Math.Ceiling((double)samples.Count / MaxPoints));
        var trim = new List<ObservablePoint>((samples.Count / step) + 2);
        var roll = new List<ObservablePoint>((samples.Count / step) + 2);
        double maxAbs = 0;

        for (var index = 0; index < samples.Count; index += step)
        {
            Accumulate(samples[index], trim, roll, ref maxAbs);
        }

        if ((samples.Count - 1) % step != 0)
        {
            Accumulate(samples[^1], trim, roll, ref maxAbs);
        }

        _chart.Series = new ISeries[]
        {
            CreateSeries(trim, "Trim", ThemeColor("ChartTrim", "#89ceff")),
            CreateSeries(roll, "Roll", ThemeColor("ChartRoll", "#ffab32")),
        };

        var scale = Math.Max(ScaleFloor, Math.Ceiling(maxAbs / ScaleFloor) * ScaleFloor);
        _yAxis.MinLimit = -scale;
        _yAxis.MaxLimit = scale;
        _yAxis.MinStep = scale <= 10 ? ScaleFloor : 10;
    }

    private static void Accumulate(
        RecordedSample sample,
        ICollection<ObservablePoint> trim,
        ICollection<ObservablePoint> roll,
        ref double maxAbs)
    {
        var seconds = sample.ElapsedMs / 1000.0;

        trim.Add(new ObservablePoint(seconds, sample.Trim));
        roll.Add(new ObservablePoint(seconds, sample.Roll));
        maxAbs = Math.Max(maxAbs, Math.Max(Math.Abs(sample.Trim), Math.Abs(sample.Roll)));
    }

    private static LineSeries<ObservablePoint> CreateSeries(
        IReadOnlyCollection<ObservablePoint> values,
        string name,
        SKColor color)
        => new()
        {
            Values = values,
            Name = name,
            Stroke = new SolidColorPaint(color, 2),
            Fill = new SolidColorPaint(color.WithAlpha(20)),
            GeometrySize = 0,
            GeometryStroke = null,
            GeometryFill = null,
            LineSmoothness = 0,
        };

    private static SKColor ThemeColor(string key, string fallback)
    {
        if (Application.Current?.Resources.TryGetValue(key, out var value) == true && value is Color color)
        {
            return new SKColor(
                (byte)(color.Red * 255),
                (byte)(color.Green * 255),
                (byte)(color.Blue * 255),
                (byte)(color.Alpha * 255));
        }

        return SKColor.Parse(fallback);
    }
}
