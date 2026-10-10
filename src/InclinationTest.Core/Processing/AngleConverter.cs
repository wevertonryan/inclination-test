using InclinationTest.Core.Models;

namespace InclinationTest.Core.Processing;

public static class AngleConverter
{
    private const double DegPerRad = 180.0 / Math.PI;

    private const double MinTrim = -90.0;

    private const double MaxTrim = 90.0;

    public static Angles ToAngles(MotionSample sample, Calibration? calibration = null)
    {
        var g = sample.AccelerationIncludingGravity;
        if (g.X == 0 && g.Y == 0 && g.Z == 0)
        {
            return new Angles(0, 0);
        }

        var rawRoll = g.X == 0 && g.Z == 0 ? 0 : Math.Atan2(-g.X, g.Z) * DegPerRad;
        var rawTrim = Math.Atan2(g.Y, Math.Sqrt((g.X * g.X) + (g.Z * g.Z))) * DegPerRad;

        var offset = calibration ?? default;
        return new Angles(Wrap180(rawRoll - offset.Roll), ClampTrim(rawTrim - offset.Trim));
    }

    // Envolve em (−180, 180]: a virada pela proa (FaceDown) cai em +180, não −180.
    private static double Wrap180(double degrees)
    {
        var wrapped = (((degrees + 180.0) % 360.0) + 360.0) % 360.0 - 180.0;
        return wrapped <= -180.0 ? wrapped + 360.0 : wrapped;
    }

    private static double ClampTrim(double degrees) => Math.Clamp(degrees, MinTrim, MaxTrim);
}
