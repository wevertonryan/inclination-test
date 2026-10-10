using InclinationTest.Core.Models;
using InclinationTest.Core.Processing;
using InclinationTest.Core.Sensors;

namespace InclinationTest.Core.ViewModels;

public sealed class InclinationViewModel
{
    public InclinationViewModel(ISensorService sensor, IFilter filter)
        => throw new NotImplementedException();

    public double Roll => throw new NotImplementedException();

    public double Trim => throw new NotImplementedException();

    public bool IsRunning => throw new NotImplementedException();

    public bool IsCalibrated => throw new NotImplementedException();

    public string? Error => throw new NotImplementedException();

#pragma warning disable CS0067
    public event Action<Angles, double>? OnSample;
#pragma warning restore CS0067

    public void Start() => throw new NotImplementedException();

    public void Stop() => throw new NotImplementedException();

    public void Calibrate() => throw new NotImplementedException();
}
