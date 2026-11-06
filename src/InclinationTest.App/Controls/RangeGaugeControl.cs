using SkiaSharp;
using SkiaSharp.Views.Maui;
using SkiaSharp.Views.Maui.Controls;

namespace InclinationTest.App.Controls;

/// <summary>Arco aberto usado no detalhe do relatório para mostrar a faixa de Roll.</summary>
public sealed class RangeGaugeControl : SKCanvasView
{
    private const float ViewWidth = 200f;
    private const float ViewHeight = 110f;
    private const float Cx = 100f;
    private const float Cy = 100f;
    private const float Radius = 75f;
    private const float SpanDegrees = 75f;

    private static readonly SKColor Track = SKColor.Parse("#2f353d");
    private static readonly SKColor Active = SKColor.Parse("#00d2d3");
    private static readonly SKColor Min = SKColor.Parse("#89ceff");
    private static readonly SKColor Max = SKColor.Parse("#ffd09b");
    private static readonly SKColor Zero = SKColor.Parse("#48efef");
    private static readonly SKColor Outline = SKColor.Parse("#859493");
    private static readonly SKColor Surface = SKColor.Parse("#0e141b");

    private readonly SKPaint _stroke = new() { IsAntialias = true, Style = SKPaintStyle.Stroke, StrokeCap = SKStrokeCap.Round };
    private readonly SKPaint _fill = new() { IsAntialias = true, Style = SKPaintStyle.Fill };

    public static readonly BindableProperty MinValueProperty = BindableProperty.Create(
        nameof(MinValue), typeof(double), typeof(RangeGaugeControl), 0d, propertyChanged: OnValueChanged);

    public static readonly BindableProperty MaxValueProperty = BindableProperty.Create(
        nameof(MaxValue), typeof(double), typeof(RangeGaugeControl), 0d, propertyChanged: OnValueChanged);

    public double MinValue
    {
        get => (double)GetValue(MinValueProperty);
        set => SetValue(MinValueProperty, value);
    }

    public double MaxValue
    {
        get => (double)GetValue(MaxValueProperty);
        set => SetValue(MaxValueProperty, value);
    }

    private static void OnValueChanged(BindableObject bindable, object oldValue, object newValue)
        => ((RangeGaugeControl)bindable).InvalidateSurface();

    protected override void OnPaintSurface(SKPaintSurfaceEventArgs e)
    {
        var canvas = e.Surface.Canvas;
        canvas.Clear(SKColors.Transparent);
        canvas.Scale(e.Info.Width / ViewWidth, e.Info.Height / ViewHeight);

        var min = double.IsFinite(MinValue) ? MinValue : 0d;
        var max = double.IsFinite(MaxValue) ? MaxValue : 0d;
        if (min > max)
        {
            (min, max) = (max, min);
        }

        var magnitude = Math.Max(5d, Math.Ceiling(Math.Max(Math.Abs(min), Math.Abs(max)) / 5d) * 5d);

        _stroke.StrokeWidth = 12f;
        _stroke.Color = Track;
        canvas.DrawPath(BuildArc(-magnitude, magnitude), _stroke);

        _stroke.StrokeWidth = 12f;
        _stroke.Color = Active;
        canvas.DrawPath(BuildArc(min, max), _stroke);

        _stroke.StrokeWidth = 2f;
        _stroke.Color = Outline;
        canvas.DrawLine(Cx, 14f, Cx, 22f, _stroke);

        _fill.Color = Zero;
        canvas.DrawCircle(Cx, 25f, 2.5f, _fill);

        var minPoint = PointAt(min, magnitude);
        var maxPoint = PointAt(max, magnitude);

        _fill.Color = Min;
        canvas.DrawCircle(minPoint, 4.5f, _fill);
        _stroke.StrokeWidth = 1.5f;
        _stroke.Color = Surface;
        canvas.DrawCircle(minPoint, 4.5f, _stroke);

        _fill.Color = Max;
        canvas.DrawCircle(maxPoint, 4.5f, _fill);
        _stroke.Color = Surface;
        canvas.DrawCircle(maxPoint, 4.5f, _stroke);
    }

    private static SKPath BuildArc(double min, double max)
    {
        var magnitude = Math.Max(5d, Math.Ceiling(Math.Max(Math.Abs(min), Math.Abs(max)) / 5d) * 5d);
        var path = new SKPath();
        var started = false;

        for (var value = min; value <= max + 0.001; value += 0.25)
        {
            var point = PointAt(value, magnitude);
            if (!started)
            {
                path.MoveTo(point);
                started = true;
            }
            else
            {
                path.LineTo(point);
            }
        }

        if (!started)
        {
            path.MoveTo(PointAt(min, magnitude));
        }

        return path;
    }

    private static SKPoint PointAt(double value, double magnitude)
    {
        var angle = (float)(90d - (Math.Clamp(value, -magnitude, magnitude) / magnitude * SpanDegrees));
        var radians = angle * MathF.PI / 180f;
        return new SKPoint(
            Cx + (Radius * MathF.Cos(radians)),
            Cy - (Radius * MathF.Sin(radians)));
    }
}
