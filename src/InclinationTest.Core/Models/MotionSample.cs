using Quaternion = System.Numerics.Quaternion;

namespace InclinationTest.Core.Models;

public readonly record struct MotionSample(
    Vector3 AccelerationIncludingGravity,
    Vector3 RotationRate,
    Quaternion Rotation,
    double Timestamp);
