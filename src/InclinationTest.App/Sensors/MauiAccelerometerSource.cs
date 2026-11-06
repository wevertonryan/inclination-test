using InclinationTest.Core.Models;
using InclinationTest.Core.Sensors;
using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.Devices.Sensors;

namespace InclinationTest.App.Sensors;

public sealed class MauiAccelerometerSource : IAccelerometerSource
{
    private EventHandler<AccelerometerChangedEventArgs>? _handler;

    public bool IsAvailable => Accelerometer.IsSupported;

    public void Start(Action<AccelerometerReading> onReading)
    {
        if (!Accelerometer.IsSupported || _handler is not null)
        {
            return;
        }

        EventHandler<AccelerometerChangedEventArgs> handler = (_, args) =>
        {
            var acceleration = args.Reading.Acceleration;
            var reading = new AccelerometerReading(
                new Vector3(acceleration.X, acceleration.Y, acceleration.Z),
                new Vector3(0, 0, 0),
                System.Numerics.Quaternion.Identity,
                Environment.TickCount64);

            MainThread.BeginInvokeOnMainThread(() => onReading(reading));
        };

        _handler = handler;
        Accelerometer.ReadingChanged += handler;
        Accelerometer.Start(SensorSpeed.Game);
    }

    public void Stop()
    {
        if (_handler is null)
        {
            return;
        }

        Accelerometer.ReadingChanged -= _handler;
        _handler = null;

        if (Accelerometer.IsMonitoring)
        {
            Accelerometer.Stop();
        }
    }
}
