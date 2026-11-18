using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Threading.Tasks;
using InclinationTest.Core.Recording;
using InclinationTest.Core.ViewModels;
using Microsoft.Maui.ApplicationModel.DataTransfer;
using Microsoft.Maui.Storage;
using SkiaSharp;

namespace InclinationTest.App.Platform;

public static class PdfExportService
{
    public static async Task ExportAndShareAsync(ReportItem report, IReadOnlyList<RecordedSample> samples)
    {
        var sanitizedTitle = string.Join("_", report.Title.Split(Path.GetInvalidFileNameChars()));
        if (string.IsNullOrWhiteSpace(sanitizedTitle)) sanitizedTitle = "Relatorio";

        var timeStamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
        var pdfFileName = $"{sanitizedTitle}_{timeStamp}.pdf";
        var csvFileName = $"{sanitizedTitle}_{timeStamp}.csv";

        var pdfPath = Path.Combine(FileSystem.CacheDirectory, pdfFileName);
        var csvPath = Path.Combine(FileSystem.CacheDirectory, csvFileName);

        GeneratePdf(pdfPath, report, samples);
        GenerateCsv(csvPath, report, samples);

#if ANDROID
        try
        {
            var publicDownloads = Android.OS.Environment.GetExternalStoragePublicDirectory(Android.OS.Environment.DirectoryDownloads)?.AbsolutePath;
            if (!string.IsNullOrEmpty(publicDownloads) && Directory.Exists(publicDownloads))
            {
                File.Copy(pdfPath, Path.Combine(publicDownloads, pdfFileName), true);
                File.Copy(csvPath, Path.Combine(publicDownloads, csvFileName), true);
            }
        }
        catch
        {
            // Se o armazenamento público estiver restrito, o Share dialog padrão cuidará da entrega
        }
#endif

        await Share.Default.RequestAsync(new ShareMultipleFilesRequest
        {
            Title = $"Laudo e Telemetria: {report.Title}",
            Files = new List<ShareFile>
            {
                new ShareFile(pdfPath, "application/pdf"),
                new ShareFile(csvPath, "text/csv")
            }
        });
    }

    private static void GenerateCsv(string filePath, ReportItem report, IReadOnlyList<RecordedSample> samples)
    {
        using var writer = new StreamWriter(filePath, false, System.Text.Encoding.UTF8);
        writer.WriteLine("# INCLINATION TEST — LAUDO DE TELEMETRIA NAVAL");
        writer.WriteLine($"# Ensaio: {report.Title}");
        writer.WriteLine($"# Data: {report.DateText}");
        writer.WriteLine($"# Local: {report.LocationText}");
        writer.WriteLine($"# Duracao: {report.DurationLongText}");
        writer.WriteLine($"# Roll Abertura (max - min): {report.RollRangeText} | Media: {report.RollMeanText} | Desvio: {report.RollStdText}");
        writer.WriteLine($"# Trim Abertura (max - min): {report.TrimRangeText} | Media: {report.TrimMeanText} | Desvio: {report.TrimStdText}");
        writer.WriteLine();
        writer.WriteLine("Tempo_s;Elapsed_ms;Roll_graus;Trim_graus");

        if (samples != null)
        {
            foreach (var s in samples)
            {
                var timeSec = (s.ElapsedMs / 1000.0).ToString("0.000", CultureInfo.InvariantCulture);
                var rollStr = s.Roll.ToString("0.0000", CultureInfo.InvariantCulture);
                var trimStr = s.Trim.ToString("0.0000", CultureInfo.InvariantCulture);
                writer.WriteLine($"{timeSec};{s.ElapsedMs};{rollStr};{trimStr}");
            }
        }
    }

    private static void GeneratePdf(string filePath, ReportItem report, IReadOnlyList<RecordedSample> samples)
    {
        const float pageWidth = 595f;  // A4 standard points (72 dpi)
        const float pageHeight = 842f;

        using var doc = SKDocument.CreatePdf(filePath);
        using var canvas = doc.BeginPage(pageWidth, pageHeight);

        // Background
        using var bgPaint = new SKPaint { Color = SKColor.Parse("#f8fafc"), Style = SKPaintStyle.Fill };
        canvas.DrawRect(0, 0, pageWidth, pageHeight, bgPaint);

        // Header Banner (Estilo Náutico Escuro)
        using var headerPaint = new SKPaint { Color = SKColor.Parse("#0e141b"), Style = SKPaintStyle.Fill };
        canvas.DrawRect(0, 0, pageWidth, 80f, headerPaint);

        // Header Title
        using var titlePaint = new SKPaint
        {
            Color = SKColor.Parse("#48efef"),
            TextSize = 16f,
            IsAntialias = true,
            FakeBoldText = true
        };
        canvas.DrawText("INCLINATION TEST — LAUDO DE ESTABILIDADE NÁUTICA", 30f, 38f, titlePaint);

        using var subTitlePaint = new SKPaint
        {
            Color = SKColor.Parse("#bacac9"),
            TextSize = 10f,
            IsAntialias = true
        };
        canvas.DrawText("Ensaio de Inclinação / Prova de Mar — Telemetria de Sensores", 30f, 58f, subTitlePaint);

        float y = 95f;

        // CARD 1: DADOS DA MEDIÇÃO (y = 95, h = 82)
        DrawCard(canvas, 30f, y, pageWidth - 60f, 82f, "DADOS DA MEDIÇÃO", SKColor.Parse("#0284c7"));
        using var labelPaint = new SKPaint { Color = SKColor.Parse("#64748b"), TextSize = 9f, IsAntialias = true };
        using var valPaint = new SKPaint { Color = SKColor.Parse("#0f172a"), TextSize = 11f, IsAntialias = true, FakeBoldText = true };

        canvas.DrawText("TÍTULO DO ENSAIO", 45f, y + 36f, labelPaint);
        canvas.DrawText(report.Title, 45f, y + 50f, valPaint);

        canvas.DrawText("DATA / HORA", 220f, y + 36f, labelPaint);
        canvas.DrawText(report.DateText, 220f, y + 50f, valPaint);

        canvas.DrawText("LOCAL", 400f, y + 36f, labelPaint);
        canvas.DrawText(report.LocationText, 400f, y + 50f, valPaint);

        canvas.DrawText("DURAÇÃO", 45f, y + 70f, labelPaint);
        canvas.DrawText(report.DurationLongText, 105f, y + 70f, valPaint);

        canvas.DrawText("AMOSTRAS", 220f, y + 70f, labelPaint);
        canvas.DrawText(report.SampleCountText, 285f, y + 70f, valPaint);

        canvas.DrawText("STATUS", 400f, y + 70f, labelPaint);
        canvas.DrawText("VÁLIDO / CONCLUÍDO", 450f, y + 70f, valPaint);

        y += 94f;

        // CARD 2: ROLL & TRIM (y = 189, h = 135)
        var cardW = (pageWidth - 70f) / 2f;

        // Card Roll (Orange Theme)
        var rollX = 30f;
        DrawCard(canvas, rollX, y, cardW, 135f, "ROLL (BANDA / JOGO)", SKColor.Parse("#ea580c"));

        // Destaque Ângulo de Abertura Roll
        using var rollHighlightBg = new SKPaint { Color = SKColor.Parse("#fff7ed"), Style = SKPaintStyle.Fill };
        using var rollHighlightStroke = new SKPaint { Color = SKColor.Parse("#fed7aa"), Style = SKPaintStyle.Stroke, StrokeWidth = 1f };
        var rollHighlightRect = new SKRoundRect(new SKRect(rollX + 15f, y + 28f, rollX + cardW - 15f, y + 68f), 6f, 6f);
        canvas.DrawRoundRect(rollHighlightRect, rollHighlightBg);
        canvas.DrawRoundRect(rollHighlightRect, rollHighlightStroke);

        using var rangeTitlePaint = new SKPaint { Color = SKColor.Parse("#9a3412"), TextSize = 8f, IsAntialias = true, FakeBoldText = true };
        using var rollRangeValPaint = new SKPaint { Color = SKColor.Parse("#ea580c"), TextSize = 18f, IsAntialias = true, FakeBoldText = true };

        canvas.DrawText("ÂNGULO DE ABERTURA (MÁX − MÍN)", rollX + 25f, y + 42f, rangeTitlePaint);
        canvas.DrawText(report.RollRangeText, rollX + 25f, y + 62f, rollRangeValPaint);

        canvas.DrawText("MÉDIA", rollX + 20f, y + 84f, labelPaint);
        canvas.DrawText(report.RollMeanText, rollX + 20f, y + 98f, valPaint);

        canvas.DrawText("DESVIO PADRÃO", rollX + 140f, y + 84f, labelPaint);
        canvas.DrawText(report.RollStdText, rollX + 140f, y + 98f, valPaint);

        canvas.DrawText("MÍNIMO", rollX + 20f, y + 114f, labelPaint);
        canvas.DrawText(report.RollMinText, rollX + 65f, y + 114f, valPaint);

        canvas.DrawText("MÁXIMO", rollX + 140f, y + 114f, labelPaint);
        canvas.DrawText(report.RollMaxText, rollX + 190f, y + 114f, valPaint);

        // Card Trim (Cyan Theme)
        var trimX = 30f + cardW + 10f;
        DrawCard(canvas, trimX, y, cardW, 135f, "TRIM (COMPASSO)", SKColor.Parse("#0284c7"));

        using var trimHighlightBg = new SKPaint { Color = SKColor.Parse("#ecfeff"), Style = SKPaintStyle.Fill };
        using var trimHighlightStroke = new SKPaint { Color = SKColor.Parse("#a5f3fc"), Style = SKPaintStyle.Stroke, StrokeWidth = 1f };
        var trimHighlightRect = new SKRoundRect(new SKRect(trimX + 15f, y + 28f, trimX + cardW - 15f, y + 68f), 6f, 6f);
        canvas.DrawRoundRect(trimHighlightRect, trimHighlightBg);
        canvas.DrawRoundRect(trimHighlightRect, trimHighlightStroke);

        using var trimRangeTitlePaint = new SKPaint { Color = SKColor.Parse("#155e75"), TextSize = 8f, IsAntialias = true, FakeBoldText = true };
        using var trimRangeValPaint = new SKPaint { Color = SKColor.Parse("#0284c7"), TextSize = 18f, IsAntialias = true, FakeBoldText = true };

        canvas.DrawText("ÂNGULO DE ABERTURA (MÁX − MÍN)", trimX + 25f, y + 42f, trimRangeTitlePaint);
        canvas.DrawText(report.TrimRangeText, trimX + 25f, y + 62f, trimRangeValPaint);

        canvas.DrawText("MÉDIA", trimX + 20f, y + 84f, labelPaint);
        canvas.DrawText(report.TrimMeanText, trimX + 20f, y + 98f, valPaint);

        canvas.DrawText("DESVIO PADRÃO", trimX + 140f, y + 84f, labelPaint);
        canvas.DrawText(report.TrimStdText, trimX + 140f, y + 98f, valPaint);

        canvas.DrawText("MÍNIMO", trimX + 20f, y + 114f, labelPaint);
        canvas.DrawText(report.TrimMinText, trimX + 65f, y + 114f, valPaint);

        canvas.DrawText("MÁXIMO", trimX + 140f, y + 114f, labelPaint);
        canvas.DrawText(report.TrimMaxText, trimX + 190f, y + 114f, valPaint);

        y += 147f;

        // CARD 3: GRÁFICO ROLL × TRIM (y = 336, h = 475)
        var chartH = 470f;
        DrawCard(canvas, 30f, y, pageWidth - 60f, chartH, "CURVAS TEMPORAIS DE INCLINAÇÃO (ROLL × TRIM)", SKColor.Parse("#0f172a"));

        DrawVectorChart(canvas, 30f, y, pageWidth - 60f, chartH, samples);

        // Rodapé
        using var footerPaint = new SKPaint { Color = SKColor.Parse("#94a3b8"), TextSize = 8f, IsAntialias = true };
        canvas.DrawText($"Documento gerado em {DateTime.Now:dd/MM/yyyy HH:mm:ss} — Inclination Test Mobile (Série temporal completa anexada via CSV)", 30f, pageHeight - 12f, footerPaint);

        doc.EndPage();
        doc.Close();
    }

    private static void DrawVectorChart(SKCanvas canvas, float cardX, float cardY, float cardW, float cardH, IReadOnlyList<RecordedSample> samples)
    {
        // Legenda
        using var rollLegendPaint = new SKPaint { Color = SKColor.Parse("#ea580c"), TextSize = 10f, IsAntialias = true, FakeBoldText = true };
        using var trimLegendPaint = new SKPaint { Color = SKColor.Parse("#0284c7"), TextSize = 10f, IsAntialias = true, FakeBoldText = true };
        using var circlePaint = new SKPaint { IsAntialias = true, Style = SKPaintStyle.Fill };

        circlePaint.Color = SKColor.Parse("#ea580c");
        canvas.DrawCircle(cardX + cardW - 170f, cardY + 16f, 4f, circlePaint);
        canvas.DrawText("Roll (Banda)", cardX + cardW - 160f, cardY + 20f, rollLegendPaint);

        circlePaint.Color = SKColor.Parse("#0284c7");
        canvas.DrawCircle(cardX + cardW - 85f, cardY + 16f, 4f, circlePaint);
        canvas.DrawText("Trim (Compasso)", cardX + cardW - 75f, cardY + 20f, trimLegendPaint);

        // Área do gráfico
        var plotX = cardX + 42f;
        var plotY = cardY + 36f;
        var plotW = cardW - 55f;
        var plotH = cardH - 65f;

        // Fundo do gráfico
        using var plotBg = new SKPaint { Color = SKColor.Parse("#f8fafc"), Style = SKPaintStyle.Fill };
        using var plotBorder = new SKPaint { Color = SKColor.Parse("#e2e8f0"), Style = SKPaintStyle.Stroke, StrokeWidth = 1f };
        canvas.DrawRect(plotX, plotY, plotW, plotH, plotBg);
        canvas.DrawRect(plotX, plotY, plotW, plotH, plotBorder);

        if (samples == null || samples.Count < 2)
        {
            using var emptyPaint = new SKPaint { Color = SKColor.Parse("#94a3b8"), TextSize = 12f, IsAntialias = true };
            canvas.DrawText("Nenhuma amostra temporal gravada para exibição gráfica.", plotX + 60f, plotY + plotH / 2f, emptyPaint);
            return;
        }

        // Calcula escala angular
        var maxAngle = 5.0;
        foreach (var s in samples)
        {
            maxAngle = Math.Max(maxAngle, Math.Max(Math.Abs(s.Roll), Math.Abs(s.Trim)));
        }
        maxAngle = Math.Ceiling(maxAngle);
        if (maxAngle < 3.0) maxAngle = 3.0;

        var centerY = plotY + plotH / 2f;

        // Linhas de grade e referências de ângulo
        using var gridPaint = new SKPaint { Color = SKColor.Parse("#e2e8f0"), StrokeWidth = 1f };
        using var zeroLinePaint = new SKPaint { Color = SKColor.Parse("#94a3b8"), StrokeWidth = 1.5f };
        using var axisLabelPaint = new SKPaint { Color = SKColor.Parse("#64748b"), TextSize = 8f, IsAntialias = true };

        // Linha Zero
        canvas.DrawLine(plotX, centerY, plotX + plotW, centerY, zeroLinePaint);
        canvas.DrawText("0.0°", cardX + 16f, centerY + 3f, axisLabelPaint);

        // Grade positiva (+Max e +Max/2)
        var topY = plotY + 10f;
        var midTopY = (plotY + centerY) / 2f;
        canvas.DrawLine(plotX, topY, plotX + plotW, topY, gridPaint);
        canvas.DrawText($"+{maxAngle:0.0}°", cardX + 8f, topY + 3f, axisLabelPaint);
        canvas.DrawLine(plotX, midTopY, plotX + plotW, midTopY, gridPaint);
        canvas.DrawText($"+{(maxAngle / 2f):0.0}°", cardX + 8f, midTopY + 3f, axisLabelPaint);

        // Grade negativa (-Max e -Max/2)
        var botY = plotY + plotH - 10f;
        var midBotY = (centerY + (plotY + plotH)) / 2f;
        canvas.DrawLine(plotX, botY, plotX + plotW, botY, gridPaint);
        canvas.DrawText($"-{maxAngle:0.0}°", cardX + 8f, botY + 3f, axisLabelPaint);
        canvas.DrawLine(plotX, midBotY, plotX + plotW, midBotY, gridPaint);
        canvas.DrawText($"-{(maxAngle / 2f):0.0}°", cardX + 8f, midBotY + 3f, axisLabelPaint);

        // Eixo de Tempo X
        var totalMs = Math.Max(1L, samples[^1].ElapsedMs);
        for (var step = 0; step <= 4; step++)
        {
            var fraction = step / 4f;
            var tx = plotX + fraction * plotW;
            canvas.DrawLine(tx, plotY, tx, plotY + plotH, gridPaint);
            var sec = (fraction * (totalMs / 1000.0)).ToString("0.0", CultureInfo.InvariantCulture);
            canvas.DrawText($"{sec}s", tx - 8f, plotY + plotH + 14f, axisLabelPaint);
        }

        // Plotar Curvas com clipping para não vazar da área
        canvas.Save();
        canvas.ClipRect(new SKRect(plotX, plotY, plotX + plotW, plotY + plotH));

        using var rollCurve = new SKPaint
        {
            Color = SKColor.Parse("#ea580c"),
            StrokeWidth = 2.2f,
            IsAntialias = true,
            Style = SKPaintStyle.Stroke,
            StrokeCap = SKStrokeCap.Round,
            StrokeJoin = SKStrokeJoin.Round
        };

        using var trimCurve = new SKPaint
        {
            Color = SKColor.Parse("#0284c7"),
            StrokeWidth = 2.2f,
            IsAntialias = true,
            Style = SKPaintStyle.Stroke,
            StrokeCap = SKStrokeCap.Round,
            StrokeJoin = SKStrokeJoin.Round
        };

        using var rollPath = new SKPath();
        using var trimPath = new SKPath();

        for (var i = 0; i < samples.Count; i++)
        {
            var s = samples[i];
            var sx = plotX + ((float)s.ElapsedMs / totalMs) * plotW;
            var rollY = centerY - ((float)s.Roll / (float)maxAngle) * (plotH / 2f - 10f);
            var trimY = centerY - ((float)s.Trim / (float)maxAngle) * (plotH / 2f - 10f);

            if (i == 0)
            {
                rollPath.MoveTo(sx, rollY);
                trimPath.MoveTo(sx, trimY);
            }
            else
            {
                rollPath.LineTo(sx, rollY);
                trimPath.LineTo(sx, trimY);
            }
        }

        canvas.DrawPath(trimPath, trimCurve);
        canvas.DrawPath(rollPath, rollCurve);

        canvas.Restore();
    }

    private static void DrawCard(SKCanvas canvas, float x, float y, float w, float h, string title, SKColor titleColor)
    {
        using var cardBg = new SKPaint { Color = SKColors.White, Style = SKPaintStyle.Fill };
        using var cardBorder = new SKPaint { Color = SKColor.Parse("#cbd5e1"), Style = SKPaintStyle.Stroke, StrokeWidth = 1f };
        var rect = new SKRoundRect(new SKRect(x, y, x + w, y + h), 8f, 8f);
        canvas.DrawRoundRect(rect, cardBg);
        canvas.DrawRoundRect(rect, cardBorder);

        using var tPaint = new SKPaint
        {
            Color = titleColor,
            TextSize = 10f,
            IsAntialias = true,
            FakeBoldText = true
        };
        canvas.DrawText(title, x + 15f, y + 18f, tPaint);
    }
}
