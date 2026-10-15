using System.Collections.ObjectModel;
using System.ComponentModel;
using InclinationTest.Core.ViewModels;
using LiveChartsCore;
using LiveChartsCore.Defaults;
using LiveChartsCore.Measure;
using LiveChartsCore.SkiaSharpView;
using LiveChartsCore.SkiaSharpView.Painting;
using SkiaSharp;

namespace InclinationTest.App.Components.Features;

public partial class ChartView : ContentView
{
    private const double ScaleFloor = 5;

    private readonly ObservableCollection<ObservablePoint> _trim = new();
    private readonly ObservableCollection<ObservablePoint> _roll = new();
    private readonly Axis _xAxis;
    private readonly Axis _yAxis;

    private RecorderViewModel? _recorder;
    private double _scale = ScaleFloor;

    public ChartView()
    {
        InitializeComponent();

        Chart.Series = new ISeries[]
        {
            CreateSeries(_trim, ThemeColor("ChartTrim", "#4aa3ff")),
            CreateSeries(_roll, ThemeColor("ChartRoll", "#f5a623")),
        };

        _yAxis = new Axis
        {
            MinLimit = -ScaleFloor,
            MaxLimit = ScaleFloor,
            MinStep = ScaleFloor,
            Labeler = value => $"{value:0}°",
            TextSize = 10,
        };

        _xAxis = new Axis
        {
            MinLimit = 0,
            Labeler = FormatClock,
            TextSize = 10,
        };

        Chart.XAxes = new[] { _xAxis };
        Chart.YAxes = new[] { _yAxis };
        Chart.LegendPosition = LegendPosition.Hidden;
        Chart.TooltipPosition = TooltipPosition.Hidden;
        Chart.AnimationsSpeed = TimeSpan.Zero;
        Chart.EasingFunction = null;
    }

    protected override void OnBindingContextChanged()
    {
        base.OnBindingContextChanged();

        if (_recorder is not null)
        {
            _recorder.PropertyChanged -= OnRecorderChanged;
        }

        _recorder = BindingContext as RecorderViewModel;

        if (_recorder is not null)
        {
            _recorder.PropertyChanged += OnRecorderChanged;
        }

        Rebuild();
    }

    private static LineSeries<ObservablePoint> CreateSeries(
        ObservableCollection<ObservablePoint> values,
        SKColor color)
        => new()
        {
            Values = values,
            Stroke = new SolidColorPaint(color, 2),
            Fill = null,
            GeometrySize = 0,
            GeometryStroke = null,
            GeometryFill = null,
            LineSmoothness = 0,
        };

    private static string FormatClock(double seconds)
    {
        var total = (int)seconds;
        return $"{total / 60}:{total % 60:00}";
    }

    private void OnRecorderChanged(object? sender, PropertyChangedEventArgs e)
    {
        if (e.PropertyName == nameof(RecorderViewModel.SampleCount))
        {
            Rebuild();
        }
    }

    private void Rebuild()
    {
        _trim.Clear();
        _roll.Clear();

        double maxAbs = 0;

        if (_recorder is not null)
        {
            foreach (var sample in _recorder.Series)
            {
                var x = sample.ElapsedMs / 1000.0;
                _trim.Add(new ObservablePoint(x, sample.Trim));
                _roll.Add(new ObservablePoint(x, sample.Roll));
                maxAbs = Math.Max(maxAbs, Math.Max(Math.Abs(sample.Trim), Math.Abs(sample.Roll)));
            }
        }

        _scale = Math.Max(ScaleFloor, Math.Ceiling(maxAbs / ScaleFloor) * ScaleFloor);
        _yAxis.MinLimit = -_scale;
        _yAxis.MaxLimit = _scale;
        _yAxis.MinStep = _scale <= 10 ? ScaleFloor : 10;

    }

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
