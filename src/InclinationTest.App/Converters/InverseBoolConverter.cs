using System.Globalization;

namespace InclinationTest.App.Converters;

public sealed class InverseBoolConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
        => value is not bool flag || !flag;

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => value is not bool flag || !flag;
}
