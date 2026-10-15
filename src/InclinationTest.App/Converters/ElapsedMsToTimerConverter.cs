using System.Globalization;

namespace InclinationTest.App.Converters;

public sealed class ElapsedMsToTimerConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        var ms = value is null ? 0L : System.Convert.ToInt64(value, CultureInfo.InvariantCulture);

        var minutes = ms / 60000L;
        var seconds = (ms % 60000L) / 1000L;
        var millis = ms % 1000L;

        return $"{minutes:00}:{seconds:00} · {millis:000}";
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotSupportedException();
}
