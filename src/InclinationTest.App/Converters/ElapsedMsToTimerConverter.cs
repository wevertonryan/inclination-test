using System.Globalization;

namespace InclinationTest.App.Converters;

public sealed class ElapsedMsToTimerConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        var ms = value is null ? 0L : System.Convert.ToInt64(value, CultureInfo.InvariantCulture);

        var total = ms / 1000L;
        var hours = total / 3600L;
        var minutes = total / 60L % 60L;
        var seconds = total % 60L;
        var tenths = ms % 1000L / 100L;

        return $"{hours:00}:{minutes:00}:{seconds:00}.{tenths}";
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotSupportedException();
}
