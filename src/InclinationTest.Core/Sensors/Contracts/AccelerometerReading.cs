using InclinationTest.Core.Models;
using Quaternion = System.Numerics.Quaternion;

namespace InclinationTest.Core.Sensors;

public readonly record struct AccelerometerReading(
    Vector3 Acceleration,
    Vector3 RotationRate,
    Quaternion Rotation,
    double Timestamp);
