using InclinationTest.Core.Models;

namespace InclinationTest.Core.Processing;

public static class FilterService
{
    public static IFilter Create() => new EmaFilter();
}

internal sealed class EmaFilter : IFilter
{
    private const double Alpha = 0.15;

    private bool _primed;
    private Vector3 _gravity;
    private Vector3 _rotationRate;

    public MotionSample Process(MotionSample sample)
    {
        if (_primed)
        {
            _gravity = Blend(_gravity, sample.AccelerationIncludingGravity);
            _rotationRate = Blend(_rotationRate, sample.RotationRate);
        }
        else
        {
            _gravity = sample.AccelerationIncludingGravity;
            _rotationRate = sample.RotationRate;
            _primed = true;
        }

        return sample with
        {
            AccelerationIncludingGravity = _gravity,
            RotationRate = _rotationRate,
        };
    }

    private static Vector3 Blend(Vector3 state, Vector3 input)
        => new(
            (Alpha * input.X) + ((1 - Alpha) * state.X),
            (Alpha * input.Y) + ((1 - Alpha) * state.Y),
            (Alpha * input.Z) + ((1 - Alpha) * state.Z));
}
