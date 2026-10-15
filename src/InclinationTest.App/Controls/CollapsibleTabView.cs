using UraniumUI.Material.Controls;

namespace InclinationTest.App.Controls;

public sealed class CollapsibleTabView : TabView
{
    private const string CollapseAnimationName = "HeaderCollapse";
    private const uint CollapseDuration = 250;
    private const double FallbackHeaderHeight = 56;

    private double _headerHeight = FallbackHeaderHeight;

    public static readonly BindableProperty HeaderVisibleProperty = BindableProperty.Create(
        nameof(HeaderVisible),
        typeof(bool),
        typeof(CollapsibleTabView),
        true,
        propertyChanged: OnHeaderVisibleChanged);

    public CollapsibleTabView()
    {
        IsClippedToBounds = true;
        SizeChanged += OnSizeChanged;
    }

    public bool HeaderVisible
    {
        get => (bool)GetValue(HeaderVisibleProperty);
        set => SetValue(HeaderVisibleProperty, value);
    }

    private void OnSizeChanged(object? sender, EventArgs e)
    {
        if (_headerScrollView.Height > 0)
        {
            _headerHeight = _headerScrollView.Height;
        }
    }

    private static void OnHeaderVisibleChanged(BindableObject bindable, object oldValue, object newValue)
        => ((CollapsibleTabView)bindable).ApplyHeaderVisibility((bool)newValue);

    private void ApplyHeaderVisibility(bool visible)
    {
        this.AbortAnimation(CollapseAnimationName);

        var header = _headerScrollView;
        if (header.Height > 0)
        {
            _headerHeight = header.Height;
        }

        var height = _headerHeight <= 0 ? FallbackHeaderHeight : _headerHeight;

        if (visible)
        {
            if (header.IsVisible
                && header.HeightRequest < 0
                && Math.Abs(header.TranslationY) < 0.5
                && header.Opacity >= 0.999)
            {
                return;
            }

            header.IsVisible = true;

            var fromHeight = header.HeightRequest >= 0 ? header.HeightRequest : 0;
            Animate(header, fromHeight, height, header.TranslationY, 0, header.Opacity, 1, () =>
            {
                header.HeightRequest = -1;
                header.TranslationY = 0;
                header.Opacity = 1;
            });
        }
        else
        {
            var fromHeight = header.HeightRequest >= 0 ? header.HeightRequest : header.Height;
            if (fromHeight <= 0)
            {
                fromHeight = height;
            }

            header.IsVisible = true;
            Animate(header, fromHeight, 0, header.TranslationY, height, header.Opacity, 0, () =>
            {
                header.HeightRequest = 0;
                header.TranslationY = height;
                header.Opacity = 0;
                header.IsVisible = false;
            });
        }
    }

    private void Animate(
        VisualElement header,
        double fromHeight,
        double toHeight,
        double fromY,
        double toY,
        double fromOpacity,
        double toOpacity,
        Action finalize)
    {
        var animation = new Animation();
        animation.Add(0, 1, new Animation(v => header.HeightRequest = v, fromHeight, toHeight, Easing.CubicInOut));
        animation.Add(0, 1, new Animation(v => header.TranslationY = v, fromY, toY, Easing.CubicInOut));
        animation.Add(0, 1, new Animation(v => header.Opacity = v, fromOpacity, toOpacity, Easing.CubicInOut));

        animation.Commit(this, CollapseAnimationName, 16, CollapseDuration, Easing.Linear, (_, canceled) =>
        {
            if (!canceled)
            {
                finalize();
            }
        });
    }
}
