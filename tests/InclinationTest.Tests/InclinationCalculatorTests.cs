using InclinationTest.Core;

namespace InclinationTest.Tests;

public class InclinationCalculatorTests
{
	[Fact]
	public void AngleFromAccelerometer_WhenDeviceIsLevel_ReturnsZero()
	{
		double angle = InclinationCalculator.AngleFromAccelerometer(x: 0, y: 0, z: 1);

		Assert.Equal(0, angle, precision: 6);
	}

	[Fact]
	public void ToDegrees_ConvertsPiRadiansToOneHundredEightyDegrees()
	{
		Assert.Equal(180, InclinationCalculator.ToDegrees(Math.PI), precision: 6);
	}
}