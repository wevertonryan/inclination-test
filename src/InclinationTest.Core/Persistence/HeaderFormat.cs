using System.Globalization;
using System.Text;
using InclinationTest.Core.Recording;

namespace InclinationTest.Core.Persistence;

/// <summary>
/// Serialização do cabeçalho de um relatório em <c>chave=valor</c> (uma por linha).
/// Formato texto puro de propósito: não depende de reflexão e sobrevive a trimming/AOT.
/// </summary>
internal static class HeaderFormat
{
    private const string Version = "1";

    public static string Write(RecordingHeader header)
    {
        var builder = new StringBuilder(512);

        builder.Append("version=").Append(Version).Append('\n');
        builder.Append("id=").Append(Escape(header.Id)).Append('\n');
        builder.Append("title=").Append(Escape(header.Title)).Append('\n');
        builder.Append("startedAtMs=").Append(Number(header.StartedAtMs)).Append('\n');
        builder.Append("finishedAtMs=")
            .Append(header.FinishedAtMs is null ? string.Empty : Number(header.FinishedAtMs.Value))
            .Append('\n');
        builder.Append("durationMs=").Append(header.DurationMs.ToString(CultureInfo.InvariantCulture)).Append('\n');
        builder.Append("status=").Append(((int)header.Status).ToString(CultureInfo.InvariantCulture)).Append('\n');
        builder.Append("location=").Append(header.Location is null ? string.Empty : Escape(header.Location)).Append('\n');
        builder.Append("startedAtUtc=").Append(Date(header.StartedAtUtc)).Append('\n');
        builder.Append("savedAtUtc=").Append(Date(header.SavedAtUtc)).Append('\n');

        if (header.Summary is { } summary)
        {
            builder.Append("summary=1\n");
            builder.Append("summaryDurationMs=").Append(summary.DurationMs.ToString(CultureInfo.InvariantCulture)).Append('\n');
            builder.Append("sampleCount=").Append(summary.SampleCount.ToString(CultureInfo.InvariantCulture)).Append('\n');
            builder.Append("meanRoll=").Append(Number(summary.MeanRoll)).Append('\n');
            builder.Append("stdRoll=").Append(Number(summary.StdRoll)).Append('\n');
            builder.Append("minRoll=").Append(Number(summary.MinRoll)).Append('\n');
            builder.Append("maxRoll=").Append(Number(summary.MaxRoll)).Append('\n');
            builder.Append("meanTrim=").Append(Number(summary.MeanTrim)).Append('\n');
            builder.Append("stdTrim=").Append(Number(summary.StdTrim)).Append('\n');
            builder.Append("minTrim=").Append(Number(summary.MinTrim)).Append('\n');
            builder.Append("maxTrim=").Append(Number(summary.MaxTrim)).Append('\n');
        }
        else
        {
            builder.Append("summary=0\n");
        }

        return builder.ToString();
    }

    public static RecordingHeader Read(string text)
    {
        var values = new Dictionary<string, string>(StringComparer.Ordinal);

        foreach (var line in text.Split('\n'))
        {
            var trimmed = line.TrimEnd('\r');
            var separator = trimmed.IndexOf('=');

            if (separator <= 0)
            {
                continue;
            }

            values[trimmed[..separator]] = trimmed[(separator + 1)..];
        }

        return new RecordingHeader(
            Text(values, "id"),
            Text(values, "title"),
            Number(values, "startedAtMs"),
            Has(values, "finishedAtMs") ? Number(values, "finishedAtMs") : null,
            Long(values, "durationMs"),
            (RecordingStatus)(int)Long(values, "status"),
            ReadSummary(values),
            Has(values, "location") ? Uri.UnescapeDataString(values["location"]) : null)
        {
            StartedAtUtc = ReadDate(values, "startedAtUtc"),
            SavedAtUtc = ReadDate(values, "savedAtUtc"),
        };
    }

    private static RecordingSummary? ReadSummary(IReadOnlyDictionary<string, string> values)
        => values.TryGetValue("summary", out var summary) && summary == "1"
            ? new RecordingSummary(
                Long(values, "summaryDurationMs"),
                (int)Long(values, "sampleCount"),
                Number(values, "meanRoll"),
                Number(values, "stdRoll"),
                Number(values, "minRoll"),
                Number(values, "maxRoll"),
                Number(values, "meanTrim"),
                Number(values, "stdTrim"),
                Number(values, "minTrim"),
                Number(values, "maxTrim"))
            : null;

    private static bool Has(IReadOnlyDictionary<string, string> values, string key)
        => values.TryGetValue(key, out var value) && value.Length > 0;

    private static string Text(IReadOnlyDictionary<string, string> values, string key)
        => values.TryGetValue(key, out var value) ? Uri.UnescapeDataString(value) : string.Empty;

    private static double Number(IReadOnlyDictionary<string, string> values, string key)
        => values.TryGetValue(key, out var value) ? ParseNumber(value) : 0;

    private static long Long(IReadOnlyDictionary<string, string> values, string key)
        => values.TryGetValue(key, out var value)
            && long.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed)
                ? parsed
                : 0;

    private static DateTimeOffset? ReadDate(IReadOnlyDictionary<string, string> values, string key)
        => values.TryGetValue(key, out var value)
            && DateTimeOffset.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var parsed)
                ? parsed
                : null;

    private static string Escape(string value) => Uri.EscapeDataString(value);

    private static string Number(double value) => value.ToString("R", CultureInfo.InvariantCulture);

    private static double ParseNumber(string value)
        => double.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out var parsed) ? parsed : 0;

    private static string Date(DateTimeOffset? value) => value is null ? string.Empty : value.Value.ToString("O", CultureInfo.InvariantCulture);
}
