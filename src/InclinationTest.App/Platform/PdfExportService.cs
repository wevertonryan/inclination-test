using System;
using System.Collections.Generic;
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

        var fileName = $"{sanitizedTitle}_{DateTime.Now:yyyyMMdd_HHmmss}.pdf";
        var filePath = Path.Combine(FileSystem.CacheDirectory, fileName);

        GeneratePdf(filePath, report, samples);

        await Share.Default.RequestAsync(new ShareFileRequest
        {
            Title = $"Relatório: {report.Title}",
            File = new ShareFile(filePath, "application/pdf")
        });
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

        // Header Banner
        using var headerPaint = new SKPaint { Color = SKColor.Parse("#0e141b"), Style = SKPaintStyle.Fill };
        canvas.DrawRect(0, 0, pageWidth, 90f, headerPaint);

        // Header Title
        using var titlePaint = new SKPaint
        {
            Color = SKColor.Parse("#48efef"),
            TextSize = 18f,
            IsAntialias = true,
            FakeBoldText = true
        };
        canvas.DrawText("INCLINATION TEST — RELATÓRIO DE TELEMETRIA", 30f, 42f, titlePaint);

        using var subTitlePaint = new SKPaint
        {
            Color = SKColor.Parse("#bacac9"),
            TextSize = 11f,
            IsAntialias = true
        };
        canvas.DrawText("Ensaio de Inclinação e Estabilidade Náutica", 30f, 65f, subTitlePaint);

        float y = 115f;

        // Card Identificação
        DrawCard(canvas, 30f, y, pageWidth - 60f, 95f, "DADOS DA MEDIÇÃO");
        using var labelPaint = new SKPaint { Color = SKColor.Parse("#64748b"), TextSize = 10f, IsAntialias = true };
        using var valPaint = new SKPaint { Color = SKColor.Parse("#0f172a"), TextSize = 12f, IsAntialias = true, FakeBoldText = true };

        canvas.DrawText("TÍTULO", 45f, y + 42f, labelPaint);
        canvas.DrawText(report.Title, 45f, y + 58f, valPaint);

        canvas.DrawText("DATA / HORA", 220f, y + 42f, labelPaint);
        canvas.DrawText(report.DateText, 220f, y + 58f, valPaint);

        canvas.DrawText("LOCAL", 400f, y + 42f, labelPaint);
        canvas.DrawText(report.LocationText, 400f, y + 58f, valPaint);

        canvas.DrawText("DURAÇÃO", 45f, y + 80f, labelPaint);
        canvas.DrawText(report.DurationLongText, 105f, y + 80f, valPaint);

        canvas.DrawText("TOTAL AMOSTRAS", 220f, y + 80f, labelPaint);
        canvas.DrawText(report.SampleCountText, 320f, y + 80f, valPaint);

        y += 115f;

        // Card Roll
        DrawCard(canvas, 30f, y, (pageWidth - 70f) / 2f, 130f, "ROLL (BANDA)");
        var rollX = 45f;
        canvas.DrawText("MÉDIA ± DESVIO", rollX, y + 45f, labelPaint);
        canvas.DrawText(report.RollText, rollX, y + 62f, valPaint);

        canvas.DrawText("MÍNIMO", rollX, y + 82f, labelPaint);
        canvas.DrawText(report.RollMinText, rollX, y + 98f, valPaint);

        canvas.DrawText("MÁXIMO", rollX + 110f, y + 82f, labelPaint);
        canvas.DrawText(report.RollMaxText, rollX + 110f, y + 98f, valPaint);

        canvas.DrawText("ABERTURA TOTAL", rollX, y + 118f, labelPaint);
        canvas.DrawText(report.RollRangeText, rollX + 105f, y + 118f, valPaint);

        // Card Trim
        var trimX = 30f + (pageWidth - 70f) / 2f + 10f;
        DrawCard(canvas, trimX, y, (pageWidth - 70f) / 2f, 130f, "TRIM (COMPASSO)");
        canvas.DrawText("MÉDIA ± DESVIO", trimX + 15f, y + 45f, labelPaint);
        canvas.DrawText(report.TrimText, trimX + 15f, y + 62f, valPaint);

        canvas.DrawText("MÍNIMO", trimX + 15f, y + 82f, labelPaint);
        canvas.DrawText(report.TrimMinText, trimX + 15f, y + 98f, valPaint);

        canvas.DrawText("MÁXIMO", trimX + 125f, y + 82f, labelPaint);
        canvas.DrawText(report.TrimMaxText, trimX + 125f, y + 98f, valPaint);

        canvas.DrawText("ABERTURA TOTAL", trimX + 15f, y + 118f, labelPaint);
        canvas.DrawText(report.TrimRangeText, trimX + 120f, y + 118f, valPaint);

        y += 150f;

        // Amostras / Tabela
        DrawCard(canvas, 30f, y, pageWidth - 60f, 380f, "AMOSTRAS REGISTRADAS (RESUMO TEMPORAL)");

        using var colHeaderPaint = new SKPaint
        {
            Color = SKColor.Parse("#475569"),
            TextSize = 10f,
            IsAntialias = true,
            FakeBoldText = true
        };

        float rowY = y + 42f;
        canvas.DrawText("TEMPO (s)", 50f, rowY, colHeaderPaint);
        canvas.DrawText("ROLL (°)", 200f, rowY, colHeaderPaint);
        canvas.DrawText("TRIM (°)", 350f, rowY, colHeaderPaint);
        canvas.DrawText("STATUS", 470f, rowY, colHeaderPaint);

        using var linePaint = new SKPaint { Color = SKColor.Parse("#e2e8f0"), StrokeWidth = 1f };
        canvas.DrawLine(45f, rowY + 6f, pageWidth - 45f, rowY + 6f, linePaint);

        rowY += 20f;

        if (samples != null && samples.Count > 0)
        {
            var sampleStep = Math.Max(1, samples.Count / 18);
            for (var i = 0; i < samples.Count && rowY < y + 360f; i += sampleStep)
            {
                var s = samples[i];
                canvas.DrawText($"{(s.ElapsedMs / 1000.0):0.0}s", 50f, rowY, labelPaint);
                canvas.DrawText($"{s.Roll:+0.0;-0.0;0.0}°", 200f, rowY, valPaint);
                canvas.DrawText($"{s.Trim:+0.0;-0.0;0.0}°", 350f, rowY, valPaint);
                canvas.DrawText("OK", 470f, rowY, labelPaint);

                rowY += 17f;
            }
        }

        // Rodapé
        using var footerPaint = new SKPaint { Color = SKColor.Parse("#94a3b8"), TextSize = 9f, IsAntialias = true };
        canvas.DrawText($"Documento gerado em {DateTime.Now:dd/MM/yyyy HH:mm:ss} — Inclination Test Mobile App", 30f, pageHeight - 20f, footerPaint);

        doc.EndPage();
        doc.Close();
    }

    private static void DrawCard(SKCanvas canvas, float x, float y, float w, float h, string title)
    {
        using var cardBg = new SKPaint { Color = SKColors.White, Style = SKPaintStyle.Fill };
        using var cardBorder = new SKPaint { Color = SKColor.Parse("#cbd5e1"), Style = SKPaintStyle.Stroke, StrokeWidth = 1f };
        var rect = new SKRoundRect(new SKRect(x, y, x + w, y + h), 8f, 8f);
        canvas.DrawRoundRect(rect, cardBg);
        canvas.DrawRoundRect(rect, cardBorder);

        using var tPaint = new SKPaint
        {
            Color = SKColor.Parse("#0284c7"),
            TextSize = 10f,
            IsAntialias = true,
            FakeBoldText = true
        };
        canvas.DrawText(title, x + 15f, y + 20f, tPaint);
    }
}
