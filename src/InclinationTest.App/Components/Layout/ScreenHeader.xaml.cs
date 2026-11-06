namespace InclinationTest.App.Components.Layout;

public partial class ScreenHeader : ContentView
{
    public static readonly BindableProperty TitleProperty = BindableProperty.Create(
        nameof(Title),
        typeof(string),
        typeof(ScreenHeader),
        string.Empty);

    public static readonly BindableProperty LeftContentProperty = BindableProperty.Create(
        nameof(LeftContent),
        typeof(View),
        typeof(ScreenHeader),
        null,
        propertyChanged: OnLeftContentChanged);

    public static readonly BindableProperty RightContentProperty = BindableProperty.Create(
        nameof(RightContent),
        typeof(View),
        typeof(ScreenHeader),
        null,
        propertyChanged: OnRightContentChanged);

    public ScreenHeader()
    {
        InitializeComponent();
    }

    public string Title
    {
        get => (string)GetValue(TitleProperty);
        set => SetValue(TitleProperty, value);
    }

    public View? LeftContent
    {
        get => (View?)GetValue(LeftContentProperty);
        set => SetValue(LeftContentProperty, value);
    }

    public View? RightContent
    {
        get => (View?)GetValue(RightContentProperty);
        set => SetValue(RightContentProperty, value);
    }

    private static void OnLeftContentChanged(BindableObject bindable, object oldValue, object newValue)
        => ((ScreenHeader)bindable).LeftSlot.Content = (View?)newValue;

    private static void OnRightContentChanged(BindableObject bindable, object oldValue, object newValue)
        => ((ScreenHeader)bindable).RightSlot.Content = (View?)newValue;
}
