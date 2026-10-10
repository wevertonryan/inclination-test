using CommunityToolkit.Mvvm.ComponentModel;
using InclinationTest.Core.Models;
using InclinationTest.Core.Processing;
using InclinationTest.Core.Sensors;

namespace InclinationTest.Core.ViewModels;

public sealed class InclinationViewModel : ObservableObject
{
    private readonly IFilter _filter;
    private readonly ISensorService _sensor;

    private Calibration? _calibration;
    private string? _error;
    private bool _isCalibrated;
    private bool _isRunning;
    private double _roll;
    private double _trim;

    public InclinationViewModel(ISensorService sensor, IFilter filter)
    {
        _sensor = sensor;
        _filter = filter;
    }

    public double Roll
    {
        get => _roll;
        private set => SetProperty(ref _roll, value);
    }

    public double Trim
    {
        get => _trim;
        private set => SetProperty(ref _trim, value);
    }

    public bool IsRunning
    {
        get => _isRunning;
        private set => SetProperty(ref _isRunning, value);
    }

    public bool IsCalibrated
    {
        get => _isCalibrated;
        private set => SetProperty(ref _isCalibrated, value);
    }

    public string? Error
    {
        get => _error;
        private set => SetProperty(ref _error, value);
    }

    public event Action<Angles, double>? OnSample;

    public void Start()
    {
        if (_isRunning)
        {
            return;
        }

        try
        {
            _sensor.Start(HandleSample);
            IsRunning = true;
            Error = null;
        }
        catch (Exception exception)
        {
            IsRunning = false;
            Error = exception.Message;
        }
    }

    public void Stop()
    {
        if (!_isRunning)
        {
            return;
        }

        _sensor.Stop();
        IsRunning = false;
    }

    public void Calibrate()
    {
        _calibration = new Calibration(_roll, _trim);
        IsCalibrated = true;
    }

    private void HandleSample(MotionSample sample)
    {
        var filtered = _filter.Process(sample);
        var angles = AngleConverter.ToAngles(filtered, _calibration);

        Roll = angles.Roll;
        Trim = angles.Trim;

        OnSample?.Invoke(angles, filtered.Timestamp);
    }
}
