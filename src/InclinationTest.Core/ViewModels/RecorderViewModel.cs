using CommunityToolkit.Mvvm.ComponentModel;
using InclinationTest.Core.Models;
using InclinationTest.Core.Platform;
using InclinationTest.Core.Recording;

namespace InclinationTest.Core.ViewModels;

public sealed class RecorderViewModel : ObservableObject
{
    public const int DefaultTickMs = 100;

    public const int DefaultSeriesCapacity = 600;

    private readonly IRecordingSession _session;
    private readonly ITicker _ticker;
    private readonly IClock _clock;
    private readonly int _seriesCapacity;
    private readonly List<RecordedSample> _series = new();

    private RecorderMode _mode = RecorderMode.Idle;
    private ConfirmationRequest _confirmation = ConfirmationRequest.None;
    private string _title = string.Empty;
    private long _elapsedMs;
    private int _sampleCount;
    private long _accumulatedMs;
    private long _segmentStartMs;
    private long _lastPublishedMs;

    public RecorderViewModel(
        IRecordingSession session,
        ITicker ticker,
        IClock clock,
        int seriesCapacity = DefaultSeriesCapacity)
    {
        _session = session;
        _ticker = ticker;
        _clock = clock;
        _seriesCapacity = seriesCapacity;
    }

    public RecorderMode Mode
    {
        get => _mode;
        private set
        {
            if (SetProperty(ref _mode, value))
            {
                OnPropertyChanged(nameof(IsImmersive));
            }
        }
    }

    public bool IsImmersive => _mode != RecorderMode.Idle;

    public long ElapsedMs
    {
        get => _elapsedMs;
        private set => SetProperty(ref _elapsedMs, value);
    }

    public int SampleCount
    {
        get => _sampleCount;
        private set => SetProperty(ref _sampleCount, value);
    }

    public IReadOnlyList<RecordedSample> Series => _series;

    public ConfirmationRequest Confirmation
    {
        get => _confirmation;
        private set => SetProperty(ref _confirmation, value);
    }

    public string Title
    {
        get => _title;
        set => SetProperty(ref _title, value);
    }

    public void Record()
    {
        if (_mode != RecorderMode.Idle)
        {
            return;
        }

        _accumulatedMs = 0;
        _segmentStartMs = _clock.NowMs;
        _lastPublishedMs = _clock.NowMs;
        ElapsedMs = 0;
        SampleCount = 0;
        _series.Clear();

        _session.Start(_clock.NowMs);
        Mode = RecorderMode.Recording;
        Confirmation = ConfirmationRequest.None;
        _ticker.Start(OnTick);
    }

    public void Toggle()
    {
        switch (_mode)
        {
            case RecorderMode.Recording:
                _accumulatedMs += _clock.NowMs - _segmentStartMs;
                _session.Pause(_clock.NowMs);
                Mode = RecorderMode.Paused;
                break;
            case RecorderMode.Paused:
                _segmentStartMs = _clock.NowMs;
                _session.Resume(_clock.NowMs);
                Mode = RecorderMode.Recording;
                break;
        }
    }

    public void CaptureAngle(Angles angles, double timestampMs)
    {
        if (_mode != RecorderMode.Recording)
        {
            return;
        }

        var accepted = _session.Append(angles, timestampMs);
        if (accepted is null)
        {
            return;
        }

        _series.Add(accepted.Value);
        while (_series.Count > _seriesCapacity)
        {
            _series.RemoveAt(0);
        }

        SampleCount++;
    }

    public void RequestCancel() => Confirmation = ConfirmationRequest.Cancel;

    public void RequestSave() => Confirmation = ConfirmationRequest.Save;

    public void Confirm()
    {
        switch (_confirmation)
        {
            case ConfirmationRequest.Save:
                _session.Save(_title);
                ResetToIdle();
                break;
            case ConfirmationRequest.Cancel:
                _session.Discard();
                ResetToIdle();
                break;
        }
    }

    public void Dismiss() => Confirmation = ConfirmationRequest.None;

    private void OnTick()
    {
        if (_mode != RecorderMode.Recording)
        {
            return;
        }

        var now = _clock.NowMs;
        if (now - _lastPublishedMs < DefaultTickMs)
        {
            return;
        }

        _lastPublishedMs = now;
        ElapsedMs = _accumulatedMs + (now - _segmentStartMs);
    }

    private void ResetToIdle()
    {
        _ticker.Stop();
        Mode = RecorderMode.Idle;
        Confirmation = ConfirmationRequest.None;
        ElapsedMs = 0;
        SampleCount = 0;
        _accumulatedMs = 0;
        _series.Clear();
    }
}
