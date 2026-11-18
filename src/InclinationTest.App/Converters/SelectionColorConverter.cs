using System.Globalization;

namespace InclinationTest.App.Converters;

public class SelectionColorConverter : IValueConverter
{
    public Color Selected { get; set; } = Colors.Black;

    public Color Unselected { get; set; } = Colors.Gray;

    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
        => value is true ? Selected : Unselected;

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotSupportedException();
}
