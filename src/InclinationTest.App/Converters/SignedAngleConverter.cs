using System.Globalization;

namespace InclinationTest.App.Converters;

public sealed class SignedAngleConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        var angle = value is null ? 0d : System.Convert.ToDouble(value, CultureInfo.InvariantCulture);
        return angle.ToString("+0.0;-0.0;0.0", CultureInfo.InvariantCulture);
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotSupportedException();
}
