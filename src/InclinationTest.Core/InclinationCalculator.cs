namespace InclinationTest.Core;

public static class InclinationCalculator
{
	public static double AngleFromAccelerometer(double x, double y, double z)
	{
		double roll = Math.Atan2(y, Math.Sqrt(x * x + z * z));
		return ToDegrees(roll);
	}

	public static double ToDegrees(double radians) => radians * 180.0 / Math.PI;
}