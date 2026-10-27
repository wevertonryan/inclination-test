using SkiaSharp;
using SkiaSharp.Views.Maui;
using SkiaSharp.Views.Maui.Controls;

namespace InclinationTest.App.Controls;

/// <summary>
/// Inclinômetro técnico desenhado em Skia: anel de Roll rotativo + régua vertical de Trim.
/// </summary>
public class InclinometerControl : SKCanvasView
{
    private const float ViewBox = 300f;
    private const float Cx = ViewBox / 2f;
    private const float Cy = ViewBox / 2f;
    private const float OuterRadius = 146f;
    private const float RingOuter = 140f;
    private const float WellRadius = 93f;
    private const float TickOuter = 136f;
    private const float TickMajorInner = 124f;
    private const float TickMinorInner = 130f;
    private const float RollLabelRadius = 110f;
    private const float TrimTravel = 58f;
    private const float MaxTrim = 90f;

    private static readonly SKColor SurfaceLowest = SKColor.Parse("#090f16");
    private static readonly SKColor SurfaceHigh = SKColor.Parse("#252a32");
    private static readonly SKColor Outline = SKColor.Parse("#3b4949");
    private static readonly SKColor TickBright = SKColor.Parse("#eefcfb");
    private static readonly SKColor TickMuted = SKColor.Parse("#95a6a5");
    private static readonly SKColor Primary = SKColor.Parse("#48efef");
    private static readonly SKColor Secondary = SKColor.Parse("#89ceff");
    private static readonly SKColor White = SKColor.Parse("#ffffff");

    private static readonly SKTypeface Mono = SKTypeface.FromFamilyName("monospace") ?? SKTypeface.Default;

    private readonly SKPaint _fill = new() { IsAntialias = true, Style = SKPaintStyle.Fill };
    private readonly SKPaint _stroke = new() { IsAntialias = true, Style = SKPaintStyle.Stroke };
    private readonly SKPaint _text = new() { IsAntialias = true, Style = SKPaintStyle.Fill, Typeface = Mono };

    public static readonly BindableProperty RollProperty =
        BindableProperty.Create(nameof(Roll), typeof(double), typeof(InclinometerControl), 0.0, propertyChanged: OnValueChanged);

    public static readonly BindableProperty TrimProperty =
        BindableProperty.Create(nameof(Trim), typeof(double), typeof(InclinometerControl), 0.0, propertyChanged: OnValueChanged);

    public static readonly BindableProperty SizeProperty =
        BindableProperty.Create(nameof(Size), typeof(double), typeof(InclinometerControl), 300.0, propertyChanged: OnSizeChanged);

    public InclinometerControl()
    {
        UpdateSize();
    }

    public double Roll
    {
        get => (double)GetValue(RollProperty);
        set => SetValue(RollProperty, value);
    }

    public double Trim
    {
        get => (double)GetValue(TrimProperty);
        set => SetValue(TrimProperty, value);
    }

    public double Size
    {
        get => (double)GetValue(SizeProperty);
        set => SetValue(SizeProperty, value);
    }

    private static void OnValueChanged(BindableObject bindable, object oldValue, object newValue)
        => ((InclinometerControl)bindable).InvalidateSurface();

    private static void OnSizeChanged(BindableObject bindable, object oldValue, object newValue)
        => ((InclinometerControl)bindable).UpdateSize();

    private void UpdateSize()
    {
        var size = Size <= 0 ? 300 : Size;
        WidthRequest = size;
        HeightRequest = size;
    }

    protected override void OnPaintSurface(SKPaintSurfaceEventArgs e)
    {
        var canvas = e.Surface.Canvas;
        canvas.Clear(SKColors.Transparent);
        canvas.Scale(e.Info.Width / ViewBox, e.Info.Height / ViewBox);

        var roll = float.IsFinite((float)Roll) ? (float)Roll : 0f;
        var trim = float.IsFinite((float)Trim) ? (float)Trim : 0f;
        trim = Math.Clamp(trim, -MaxTrim, MaxTrim);

        DrawBezel(canvas);
        DrawWell(canvas);
        DrawTrimRack(canvas, trim);
        DrawHorizon(canvas);
        DrawRollRing(canvas, roll);
        DrawPointer(canvas);
    }

    private void DrawBezel(SKCanvas canvas)
    {
        _fill.Color = SKColors.Black.WithAlpha(90);
        canvas.DrawCircle(Cx, Cy + 3f, OuterRadius, _fill);

        _fill.Color = SurfaceLowest;
        canvas.DrawCircle(Cx, Cy, OuterRadius, _fill);

        using var glow = SKShader.CreateLinearGradient(
            new SKPoint(Cx, 0f),
            new SKPoint(Cx, ViewBox),
            new[] { Primary.WithAlpha(26), SKColors.Transparent, Secondary.WithAlpha(10) },
            new[] { 0f, 0.52f, 1f },
            SKShaderTileMode.Clamp);

        _fill.Shader = glow;
        canvas.DrawCircle(Cx, Cy, OuterRadius, _fill);
        _fill.Shader = null;

        _stroke.Color = Outline.WithAlpha(160);
        _stroke.StrokeWidth = 1.2f;
        canvas.DrawCircle(Cx, Cy, OuterRadius, _stroke);
    }

    private void DrawWell(SKCanvas canvas)
    {
        _fill.Color = SurfaceHigh;
        canvas.DrawCircle(Cx, Cy, WellRadius, _fill);

        _fill.Color = SKColors.White.WithAlpha(18);
        const float spacing = 12f;
        for (var y = Cy - WellRadius + 8f; y <= Cy + WellRadius - 8f; y += spacing)
        {
            for (var x = Cx - WellRadius + 8f; x <= Cx + WellRadius - 8f; x += spacing)
            {
                var dx = x - Cx;
                var dy = y - Cy;
                if ((dx * dx) + (dy * dy) < (WellRadius - 9f) * (WellRadius - 9f))
                {
                    canvas.DrawCircle(x, y, 0.8f, _fill);
                }
            }
        }

        _stroke.Color = SKColors.Black.WithAlpha(70);
        _stroke.StrokeWidth = 5f;
        canvas.DrawCircle(Cx, Cy, WellRadius - 1f, _stroke);
    }

    private void DrawTrimRack(SKCanvas canvas, float trim)
    {
        var offset = trim * (TrimTravel / MaxTrim);

        canvas.Save();
        canvas.Translate(0f, offset);

        _text.TextAlign = SKTextAlign.Center;

        for (var value = -90; value <= 90; value += 15)
        {
            var y = Cy - (value * TrimTravel / MaxTrim);
            var major = value % 30 == 0;

            if (value == 0)
            {
                continue;
            }

            _stroke.Color = major ? TickBright : TickMuted;
            _stroke.StrokeWidth = major ? 1.4f : 1f;
            canvas.DrawLine(Cx - 34f, y, Cx - 23f, y, _stroke);
            canvas.DrawLine(Cx + 23f, y, Cx + 34f, y, _stroke);

            _text.Color = major ? TickBright : TickMuted.WithAlpha(205);
            _text.TextSize = major ? 10.5f : 9.5f;
            _text.FakeBoldText = major;
            var prefix = value > 0 ? "+" : string.Empty;
            canvas.DrawText($"{prefix}{value}°", Cx, y + 3.5f, _text);
        }

        var zeroTop = Cy - 11f;
        _fill.Color = SurfaceLowest.WithAlpha(235);
        canvas.DrawRoundRect(new SKRoundRect(new SKRect(Cx - 22f, zeroTop, Cx + 22f, zeroTop + 22f), 5f, 5f), _fill);
        _text.Color = White;
        _text.TextSize = 13f;
        _text.FakeBoldText = true;
        canvas.DrawText("0°", Cx, Cy + 4.5f, _text);

        canvas.Restore();
    }

    private void DrawHorizon(SKCanvas canvas)
    {
        _stroke.Color = White.WithAlpha(215);
        _stroke.StrokeWidth = 1.6f;
        canvas.DrawLine(Cx - 80f, Cy, Cx + 80f, Cy, _stroke);

        using var path = new SKPath();
        path.MoveTo(Cx - 80f, Cy);
        path.LineTo(Cx - 73f, Cy - 4f);
        path.MoveTo(Cx - 80f, Cy);
        path.LineTo(Cx - 73f, Cy + 4f);
        path.MoveTo(Cx + 80f, Cy);
        path.LineTo(Cx + 73f, Cy - 4f);
        path.MoveTo(Cx + 80f, Cy);
        path.LineTo(Cx + 73f, Cy + 4f);
        canvas.DrawPath(path, _stroke);
    }

    private void DrawRollRing(SKCanvas canvas, float roll)
    {
        _stroke.Color = Outline.WithAlpha(210);
        _stroke.StrokeWidth = 1.2f;
        canvas.DrawCircle(Cx, Cy, WellRadius + 1f, _stroke);
        canvas.DrawCircle(Cx, Cy, RingOuter, _stroke);

        canvas.Save();
        canvas.RotateDegrees(roll, Cx, Cy);

        for (var direction = 1; direction >= -1; direction -= 2)
        {
            for (var value = 0; value <= 180; value += 10)
            {
                var major = value % 30 == 0;
                var angle = 90f - (direction * value);
                var outer = Polar(TickOuter, angle);
                var inner = Polar(major ? TickMajorInner : TickMinorInner, angle);

                _stroke.Color = major ? TickBright : TickMuted.WithAlpha(175);
                _stroke.StrokeWidth = major ? 1.6f : 0.9f;
                canvas.DrawLine(outer, inner, _stroke);

                if (!major)
                {
                    continue;
                }

                var label = Polar(RollLabelRadius, angle);
                _text.Color = value == 0 ? Primary : TickMuted.WithAlpha(225);
                _text.TextSize = value % 90 == 0 ? 11f : 9.5f;
                _text.FakeBoldText = value % 90 == 0;
                _text.TextAlign = SKTextAlign.Center;
                canvas.DrawText($"{value}°", label.X, label.Y + 3.5f, _text);
            }
        }

        canvas.Restore();
    }

    private void DrawPointer(SKCanvas canvas)
    {
        using var path = new SKPath();
        path.MoveTo(Cx - 7f, 3f);
        path.LineTo(Cx + 7f, 3f);
        path.LineTo(Cx, 14f);
        path.Close();

        _fill.Shader = null;
        _fill.Color = White;
        canvas.DrawPath(path, _fill);

        _stroke.Color = White.WithAlpha(80);
        _stroke.StrokeWidth = 2.5f;
        canvas.DrawLine(Cx, 14f, Cx, 24f, _stroke);
    }

    private static SKPoint Polar(float radius, float angleDegrees)
    {
        var radians = angleDegrees * MathF.PI / 180f;
        return new SKPoint(Cx + (radius * MathF.Cos(radians)), Cy - (radius * MathF.Sin(radians)));
    }
}
