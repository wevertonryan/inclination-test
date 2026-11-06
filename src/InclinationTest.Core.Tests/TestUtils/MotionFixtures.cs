using InclinationTest.Core.Models;
using Quaternion = System.Numerics.Quaternion;
using Vector3 = InclinationTest.Core.Models.Vector3;

namespace InclinationTest.Core.Tests.TestUtils;

public static class MotionFixtures
{
    public static readonly Vector3 FlatScreenUp = new(0, 0, +1);
    public static readonly Vector3 FaceDown = new(0, 0, -1);
    public static readonly Vector3 RightEdgeDown = new(-1, 0, 0);
    public static readonly Vector3 LeftEdgeDown = new(+1, 0, 0);
    public static readonly Vector3 BowUp = new(0, +1, 0);
    public static readonly Vector3 BowDown = new(0, -1, 0);
    public static readonly Vector3 RightEdgeDown45 = new(-Math.Sqrt(0.5), 0, Math.Sqrt(0.5));
    public static readonly Vector3 BowUp45 = new(0, Math.Sqrt(0.5), Math.Sqrt(0.5));

    public static MotionSample Sample(Vector3 acceleration, double timestamp = 0)
        => new(acceleration, new Vector3(0, 0, 0), Quaternion.Identity, timestamp);

    public static Vector3 FromAngles(double rollDegrees, double trimDegrees)
    {
        var roll = rollDegrees * Math.PI / 180.0;
        var trim = trimDegrees * Math.PI / 180.0;

        return new Vector3(
            -Math.Cos(trim) * Math.Sin(roll),
            Math.Sin(trim),
            Math.Cos(trim) * Math.Cos(roll));
    }
}
