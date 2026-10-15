using SkiaSharp;
using SkiaSharp.Views.Maui;
using SkiaSharp.Views.Maui.Controls;

namespace InclinationTest.App.Controls;

public class InclinometerControl : SKCanvasView
{
    private const int ViewBox = 260;
    private const float Cx = ViewBox / 2f;
    private const float Cy = ViewBox / 2f;

    private const float R = 112f;
    private const float Hole = 62f;
    private const float TickOut = 106f;
    private const float TickInMajor = 96f;
    private const float TickInMinor = 101f;
    private const float LabelR = 78f;
    private const float StripWidth = 46f;
    private const float StripHalf = 76f;
    private const float TrimTravel = 52f;
    private const int MajorStep = 30;
    private const int MinorStep = 10;
    private const int MaxRoll = 180;
    private const int MaxTrim = 90;
    private const float MinorTickWidth = 1.5f;
    private const float MajorTickWidth = 2f;
    private const float RollLabelSize = 14f;
    private const float TrimLabelSize = 12f;
    private const float TrimIndexHalfWidth = Hole - 8f;

    private static readonly SKColor RollColor = SKColor.Parse("#FFB300");
    private static readonly SKColor TrimColor = SKColor.Parse("#2196F3");
    private static readonly SKColor BgCard = SKColor.Parse("#151515");
    private static readonly SKColor Border = SKColor.Parse("#3C3C3C");
    private static readonly SKColor Text = SKColor.Parse("#FFFFFF");
    private static readonly SKColor TextMuted = SKColor.Parse("#9E9E9E");

    private static readonly SKPath AnnulusPath;
    private static readonly SKPath PointerPath;
    private static readonly SKPath TrimStripRect;

    private static readonly float[] RollLinesX1, RollLinesY1, RollLinesX2, RollLinesY2, RollLinesWidth;
    private static readonly SKColor[] RollLinesColor;
    private static readonly int RollLineCount;
    private static readonly float[] RollLabelsX, RollLabelsY;
    private static readonly string[] RollLabelsText;
    private static readonly int RollLabelCount;

    private static readonly float[] TrimLinesX1, TrimLinesY1, TrimLinesX2, TrimLinesY2, TrimLinesWidth;
    private static readonly SKColor[] TrimLinesColor;
    private static readonly int TrimLineCount;
    private static readonly float[] TrimLabelsX, TrimLabelsY;
    private static readonly string[] TrimLabelsText;
    private static readonly int TrimLabelCount;

    private static readonly SKPaint BgCardPaint;
    private static readonly SKPaint BorderPaint;
    private static readonly SKPaint DashedPaint;
    private static readonly SKPaint RollPaint;
    private static readonly SKPaint TrimStripPaint;
    private static readonly SKPaint TrimStripStrokePaint;
    private static readonly SKPaint TextMutedPaint;
    private static readonly SKPaint TextPaint;

    public static readonly BindableProperty RollProperty =
        BindableProperty.Create(nameof(Roll), typeof(double), typeof(InclinometerControl), 0.0, propertyChanged: OnValueChanged);

    public static readonly BindableProperty TrimProperty =
        BindableProperty.Create(nameof(Trim), typeof(double), typeof(InclinometerControl), 0.0, propertyChanged: OnValueChanged);

    public static readonly BindableProperty SizeProperty =
        BindableProperty.Create(nameof(Size), typeof(double), typeof(InclinometerControl), 260.0, propertyChanged: OnSizeChanged);

    static InclinometerControl()
    {
        BgCardPaint = new SKPaint { Color = BgCard, Style = SKPaintStyle.Fill, IsAntialias = true };
        BorderPaint = new SKPaint { Color = Border, Style = SKPaintStyle.Stroke, StrokeWidth = 3f, IsAntialias = true };
        DashedPaint = new SKPaint { Color = Border, Style = SKPaintStyle.Stroke, StrokeWidth = 2f, PathEffect = SKPathEffect.CreateDash([4f, 4f], 0), IsAntialias = true };
        RollPaint = new SKPaint { Color = RollColor, Style = SKPaintStyle.Fill, IsAntialias = true };
        TrimStripPaint = new SKPaint { Color = BgCard, Style = SKPaintStyle.Fill, IsAntialias = true };
        TrimStripStrokePaint = new SKPaint { Color = Border, Style = SKPaintStyle.Stroke, StrokeWidth = 1f, IsAntialias = true };
        TextPaint = new SKPaint { Color = Text, Style = SKPaintStyle.Fill, IsAntialias = true };
        TextMutedPaint = new SKPaint { Color = TextMuted, Style = SKPaintStyle.Fill, IsAntialias = true };

        AnnulusPath = new SKPath();
        var outerPath = new SKPath();
        outerPath.AddCircle(Cx, Cy, R);
        var innerPath = new SKPath();
        innerPath.AddCircle(Cx, Cy, Hole);
        AnnulusPath.AddPath(outerPath);
        AnnulusPath.AddPath(innerPath);
        AnnulusPath.FillType = SKPathFillType.EvenOdd;

        PointerPath = new SKPath();
        PointerPath.MoveTo(Cx - 9f, Cy - R - 4f);
        PointerPath.LineTo(Cx + 9f, Cy - R - 4f);
        PointerPath.LineTo(Cx, Cy - R + 16f);
        PointerPath.Close();

        TrimStripRect = new SKPath();
        TrimStripRect.AddRoundRect(new SKRoundRect(new SKRect(Cx - StripWidth / 2f, Cy - StripHalf, Cx + StripWidth / 2f, Cy + StripHalf), 4f, 4f));

        var rollLinesList = new List<(float x1, float y1, float x2, float y2, float w, SKColor c)>(1024);
        var rollLabelsList = new List<(float x, float y, string t)>(24);
        for (int dir = 1; dir >= -1; dir -= 2)
        {
            for (int v = 0; v <= MaxRoll; v += MinorStep)
            {
                bool major = v % MajorStep == 0;
                float angle = 90f - dir * v;
                var outp = Polar(TickOut, angle);
                var inp = Polar(major ? TickInMajor : TickInMinor, angle);
                rollLinesList.Add((outp.X, outp.Y, inp.X, inp.Y, major ? MajorTickWidth : MinorTickWidth, major ? Text : TextMuted));
                if (!major || v == 0 || (v == MaxRoll && dir != 1)) continue;
                var lbl = Polar(LabelR, angle);
                rollLabelsList.Add((lbl.X, CenteredBaselineY(lbl.Y, RollLabelSize), v.ToString()));
            }
        }
        RollLineCount = rollLinesList.Count;
        RollLinesX1 = new float[RollLineCount]; RollLinesY1 = new float[RollLineCount];
        RollLinesX2 = new float[RollLineCount]; RollLinesY2 = new float[RollLineCount];
        RollLinesWidth = new float[RollLineCount]; RollLinesColor = new SKColor[RollLineCount];
        for (int i = 0; i < RollLineCount; i++)
        {
            RollLinesX1[i] = rollLinesList[i].x1; RollLinesY1[i] = rollLinesList[i].y1;
            RollLinesX2[i] = rollLinesList[i].x2; RollLinesY2[i] = rollLinesList[i].y2;
            RollLinesWidth[i] = rollLinesList[i].w; RollLinesColor[i] = rollLinesList[i].c;
        }
        RollLabelCount = rollLabelsList.Count;
        RollLabelsX = new float[RollLabelCount]; RollLabelsY = new float[RollLabelCount];
        RollLabelsText = new string[RollLabelCount];
        for (int i = 0; i < RollLabelCount; i++) { RollLabelsX[i] = rollLabelsList[i].x; RollLabelsY[i] = rollLabelsList[i].y; RollLabelsText[i] = rollLabelsList[i].t; }

        var trimLinesList = new List<(float x1, float y1, float x2, float y2, float w, SKColor c)>(200);
        var trimLabelsList = new List<(float x, float y, string t)>(12);
        float spd = TrimTravel / MaxTrim;
        for (int v = 0; v <= MaxTrim; v += MinorStep)
        {
            bool major = v % MajorStep == 0;
            float off = v * spd;
            if (v == 0) { trimLinesList.Add((Cx - 12f, Cy, Cx + 12f, Cy, MajorTickWidth, Text)); continue; }
            for (int k = 0; k < 2; k++)
            {
                float y = k == 0 ? Cy - off : Cy + off;
                trimLinesList.Add((Cx - 12f, y, Cx + 12f, y, major ? MajorTickWidth : MinorTickWidth, major ? Text : TextMuted));
            }
            if (!major) continue;
            for (int k = 0; k < 2; k++)
            {
                float y = k == 0 ? Cy - off : Cy + off;
                trimLabelsList.Add((Cx - 19f, CenteredBaselineY(y, TrimLabelSize), v.ToString()));
            }
        }
        TrimLineCount = trimLinesList.Count;
        TrimLinesX1 = new float[TrimLineCount]; TrimLinesY1 = new float[TrimLineCount];
        TrimLinesX2 = new float[TrimLineCount]; TrimLinesY2 = new float[TrimLineCount];
        TrimLinesWidth = new float[TrimLineCount]; TrimLinesColor = new SKColor[TrimLineCount];
        for (int i = 0; i < TrimLineCount; i++)
        {
            TrimLinesX1[i] = trimLinesList[i].x1; TrimLinesY1[i] = trimLinesList[i].y1;
            TrimLinesX2[i] = trimLinesList[i].x2; TrimLinesY2[i] = trimLinesList[i].y2;
            TrimLinesWidth[i] = trimLinesList[i].w; TrimLinesColor[i] = trimLinesList[i].c;
        }
        TrimLabelCount = trimLabelsList.Count;
        TrimLabelsX = new float[TrimLabelCount]; TrimLabelsY = new float[TrimLabelCount];
        TrimLabelsText = new string[TrimLabelCount];
        for (int i = 0; i < TrimLabelCount; i++) { TrimLabelsX[i] = trimLabelsList[i].x; TrimLabelsY[i] = trimLabelsList[i].y; TrimLabelsText[i] = trimLabelsList[i].t; }
    }

    public InclinometerControl()
    {
        UpdateSize();
    }

    private static SKPoint Polar(float radius, float angleDeg)
    {
        float rad = angleDeg * MathF.PI / 180f;
        return new SKPoint(Cx + radius * MathF.Cos(rad), Cy - radius * MathF.Sin(rad));
    }

    private static float CenteredBaselineY(float y, float fontSize) => y + MathF.Round(fontSize * 0.36f);

    public double Roll { get => (double)GetValue(RollProperty); set => SetValue(RollProperty, value); }
    public double Trim { get => (double)GetValue(TrimProperty); set => SetValue(TrimProperty, value); }
    public double Size { get => (double)GetValue(SizeProperty); set => SetValue(SizeProperty, value); }

    private static void OnValueChanged(BindableObject b, object o, object n) { ((InclinometerControl)b).InvalidateSurface(); }
    private static void OnSizeChanged(BindableObject b, object o, object n) { ((InclinometerControl)b).UpdateSize(); }

    private void UpdateSize()
    {
        double s = Size <= 0 ? 260 : Size;
        WidthRequest = s; HeightRequest = s;
    }

    protected override void OnPaintSurface(SKPaintSurfaceEventArgs e)
    {
        var canvas = e.Surface.Canvas;
        canvas.Clear(SKColors.Transparent);
        float w = e.Info.Width;
        float h = e.Info.Height;
        canvas.Scale(w / ViewBox, h / ViewBox);

        float rollVal = float.IsFinite((float)Roll) ? (float)Roll : 0f;
        float trimVal = float.IsFinite((float)Trim) ? (float)Trim : 0f;
        if (trimVal > MaxTrim) trimVal = MaxTrim;
        if (trimVal < -MaxTrim) trimVal = -MaxTrim;
        float trimOffset = trimVal * (TrimTravel / MaxTrim);

        // Trim
        canvas.Save();
        canvas.Translate(0, trimOffset);
        canvas.DrawPath(TrimStripRect, TrimStripPaint);
        canvas.DrawPath(TrimStripRect, TrimStripStrokePaint);
        using (var p = new SKPaint { IsAntialias = true, Style = SKPaintStyle.Stroke })
        {
            for (int i = 0; i < TrimLineCount; i++)
            {
                p.Color = TrimLinesColor[i]; p.StrokeWidth = TrimLinesWidth[i];
                canvas.DrawLine(TrimLinesX1[i], TrimLinesY1[i], TrimLinesX2[i], TrimLinesY2[i], p);
            }
        }
        TextMutedPaint.TextSize = TrimLabelSize;
        TextMutedPaint.TextAlign = SKTextAlign.Right;
        for (int i = 0; i < TrimLabelCount; i++) canvas.DrawText(TrimLabelsText[i], TrimLabelsX[i], TrimLabelsY[i], TextMutedPaint);
        canvas.Restore();

        // Annulus
        canvas.DrawPath(AnnulusPath, BgCardPaint);
        canvas.DrawCircle(Cx, Cy, Hole, BorderPaint);
        canvas.DrawCircle(Cx, Cy, R, BorderPaint);
        canvas.DrawLine(Cx - TrimIndexHalfWidth, Cy, Cx + TrimIndexHalfWidth, Cy, DashedPaint);

        // Roll
        canvas.Save();
        canvas.RotateDegrees(rollVal, Cx, Cy);
        using (var p = new SKPaint { IsAntialias = true, Style = SKPaintStyle.Stroke })
        {
            for (int i = 0; i < RollLineCount; i++)
            {
                p.Color = RollLinesColor[i]; p.StrokeWidth = RollLinesWidth[i];
                canvas.DrawLine(RollLinesX1[i], RollLinesY1[i], RollLinesX2[i], RollLinesY2[i], p);
            }
        }
        TextMutedPaint.TextSize = RollLabelSize;
        TextMutedPaint.TextAlign = SKTextAlign.Center;
        for (int i = 0; i < RollLabelCount; i++) canvas.DrawText(RollLabelsText[i], RollLabelsX[i], RollLabelsY[i], TextMutedPaint);
        canvas.Restore();

        canvas.DrawPath(PointerPath, RollPaint);
    }
}
