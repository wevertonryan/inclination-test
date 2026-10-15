using FluentAssertions;
using InclinationTest.Core.Tests.TestUtils;
using InclinationTest.Core.Tests.TestUtils.Fakes;
using InclinationTest.Core.ViewModels;
using Xunit;

namespace InclinationTest.Core.Tests.ViewModels;

public class RecorderViewModelTests
{
    // --- Estado inicial ---

    [Fact]
    public void Initial_ModeIdle()
    {
        var (viewModel, _, _, _) = Create();

        viewModel.Mode.Should().Be(RecorderMode.Idle);
    }

    [Fact]
    public void Initial_IsImmersiveFalse()
    {
        var (viewModel, _, _, _) = Create();

        viewModel.IsImmersive.Should().BeFalse();
    }

    [Fact]
    public void Initial_ElapsedZero()
    {
        var (viewModel, _, _, _) = Create();

        viewModel.ElapsedMs.Should().Be(0);
    }

    [Fact]
    public void Initial_SampleCountZero()
    {
        var (viewModel, _, _, _) = Create();

        viewModel.SampleCount.Should().Be(0);
    }

    [Fact]
    public void Initial_SeriesEmpty()
    {
        var (viewModel, _, _, _) = Create();

        viewModel.Series.Should().BeEmpty();
    }

    [Fact]
    public void Initial_ConfirmationNone()
    {
        var (viewModel, _, _, _) = Create();

        viewModel.Confirmation.Should().Be(ConfirmationRequest.None);
    }

    // --- Iniciar gravação ---

    [Fact]
    public void Record_SetsModeRecording()
    {
        var (viewModel, _, _, _) = Create();

        viewModel.Record();

        viewModel.Mode.Should().Be(RecorderMode.Recording);
    }

    [Fact]
    public void Record_StartsSession()
    {
        var (viewModel, session, _, _) = Create();

        viewModel.Record();

        session.StartCount.Should().Be(1);
    }

    [Fact]
    public void Record_StartsTicker()
    {
        var (viewModel, _, ticker, _) = Create();

        viewModel.Record();

        ticker.StartCount.Should().Be(1);
    }

    [Fact]
    public void Record_Twice_IsIgnored()
    {
        var (viewModel, session, _, _) = Create();

        viewModel.Record();
        viewModel.Record();

        session.StartCount.Should().Be(1);
    }

    [Fact]
    public void Record_IsImmersiveTrue()
    {
        var (viewModel, _, _, _) = Create();

        viewModel.Record();

        viewModel.IsImmersive.Should().BeTrue();
    }

    // --- Captura de ângulos ---

    [Fact]
    public void CaptureAngle_WhenIdle_IsIgnored()
    {
        var (viewModel, session, _, _) = Create();

        viewModel.CaptureAngle(RecordingFixtures.Angle(10, 5), 0);

        session.Appended.Should().BeEmpty();
    }

    [Fact]
    public void CaptureAngle_WhenRecording_ForwardsToSession()
    {
        var (viewModel, session, _, _) = Create();
        viewModel.Record();

        viewModel.CaptureAngle(RecordingFixtures.Angle(10, 5), 100);

        session.Appended.Should().ContainSingle();
    }

    [Fact]
    public void CaptureAngle_WhenRecording_AddsToSeries()
    {
        var (viewModel, _, _, _) = Create();
        viewModel.Record();

        viewModel.CaptureAngle(RecordingFixtures.Angle(10, 5), 100);

        viewModel.Series.Should().ContainSingle();
    }

    [Fact]
    public void CaptureAngle_WhenRecording_IncrementsSampleCount()
    {
        var (viewModel, _, _, _) = Create();
        viewModel.Record();

        viewModel.CaptureAngle(RecordingFixtures.Angle(10, 5), 100);

        viewModel.SampleCount.Should().Be(1);
    }

    [Fact]
    public void CaptureAngle_WhenPaused_IsIgnored()
    {
        var (viewModel, session, _, _) = Create();
        viewModel.Record();
        viewModel.Toggle();

        viewModel.CaptureAngle(RecordingFixtures.Angle(10, 5), 200);

        session.Appended.Should().BeEmpty();
    }

    // --- Pausar / retomar ---

    [Fact]
    public void Toggle_WhenRecording_Pauses()
    {
        var (viewModel, session, _, _) = Create();
        viewModel.Record();

        viewModel.Toggle();

        viewModel.Mode.Should().Be(RecorderMode.Paused);
        session.PauseCount.Should().Be(1);
    }

    [Fact]
    public void Toggle_WhenPaused_Resumes()
    {
        var (viewModel, session, _, _) = Create();
        viewModel.Record();
        viewModel.Toggle();

        viewModel.Toggle();

        viewModel.Mode.Should().Be(RecorderMode.Recording);
        session.ResumeCount.Should().Be(1);
    }

    [Fact]
    public void Toggle_WhenIdle_IsIgnored()
    {
        var (viewModel, session, _, _) = Create();

        viewModel.Toggle();

        viewModel.Mode.Should().Be(RecorderMode.Idle);
        session.PauseCount.Should().Be(0);
    }

    // --- Cronômetro ---

    [Fact]
    public void Tick_UpdatesElapsedMs()
    {
        var (viewModel, _, ticker, clock) = Create();
        viewModel.Record();

        clock.NowMs = 500;
        ticker.Fire();

        viewModel.ElapsedMs.Should().Be(500);
    }

    [Fact]
    public void Tick_ThrottlesPublishTo100ms()
    {
        var (viewModel, _, ticker, clock) = Create();
        viewModel.Record();

        clock.NowMs = 50;
        ticker.Fire();
        viewModel.ElapsedMs.Should().Be(0);

        clock.NowMs = 100;
        ticker.Fire();
        viewModel.ElapsedMs.Should().Be(100);
    }

    [Fact]
    public void Pause_FreezesElapsed()
    {
        var (viewModel, _, ticker, clock) = Create();
        viewModel.Record();
        clock.NowMs = 200;
        ticker.Fire();
        viewModel.Toggle();

        clock.NowMs = 500;
        ticker.Fire();

        viewModel.ElapsedMs.Should().Be(200);
    }

    [Fact]
    public void Resume_ContinuesElapsed()
    {
        var (viewModel, _, ticker, clock) = Create();
        viewModel.Record();
        clock.NowMs = 200;
        ticker.Fire();
        viewModel.Toggle();
        clock.NowMs = 500;
        viewModel.Toggle();

        clock.NowMs = 700;
        ticker.Fire();

        viewModel.ElapsedMs.Should().Be(400);
    }

    // --- Confirmação / salvar / cancelar ---

    [Fact]
    public void RequestCancel_SetsConfirmationCancel()
    {
        var (viewModel, _, _, _) = Create();
        viewModel.Record();

        viewModel.RequestCancel();

        viewModel.Confirmation.Should().Be(ConfirmationRequest.Cancel);
    }

    [Fact]
    public void RequestSave_SetsConfirmationSave()
    {
        var (viewModel, _, _, _) = Create();
        viewModel.Record();

        viewModel.RequestSave();

        viewModel.Confirmation.Should().Be(ConfirmationRequest.Save);
    }

    [Fact]
    public void ConfirmSave_SavesSessionWithTitle()
    {
        var (viewModel, session, _, _) = Create();
        viewModel.Record();
        viewModel.Title = "Prova de Inclinação";
        viewModel.RequestSave();

        viewModel.Confirm();

        session.SaveCount.Should().Be(1);
        session.LastTitle.Should().Be("Prova de Inclinação");
    }

    [Fact]
    public void ConfirmSave_ReturnsToIdle()
    {
        var (viewModel, _, _, _) = Create();
        viewModel.Record();
        viewModel.RequestSave();

        viewModel.Confirm();

        viewModel.Mode.Should().Be(RecorderMode.Idle);
    }

    [Fact]
    public void ConfirmSave_ResetsState()
    {
        var (viewModel, _, _, _) = Create();
        viewModel.Record();
        viewModel.CaptureAngle(RecordingFixtures.Angle(1, 1), 0);
        viewModel.RequestSave();

        viewModel.Confirm();

        viewModel.SampleCount.Should().Be(0);
        viewModel.Series.Should().BeEmpty();
        viewModel.ElapsedMs.Should().Be(0);
    }

    [Fact]
    public void ConfirmCancel_DiscardsSession()
    {
        var (viewModel, session, _, _) = Create();
        viewModel.Record();
        viewModel.RequestCancel();

        viewModel.Confirm();

        session.DiscardCount.Should().Be(1);
    }

    [Fact]
    public void ConfirmCancel_ReturnsToIdle()
    {
        var (viewModel, _, _, _) = Create();
        viewModel.Record();
        viewModel.RequestCancel();

        viewModel.Confirm();

        viewModel.Mode.Should().Be(RecorderMode.Idle);
    }

    [Fact]
    public void Dismiss_ClearsConfirmationAndKeepsMode()
    {
        var (viewModel, _, _, _) = Create();
        viewModel.Record();
        viewModel.RequestSave();

        viewModel.Dismiss();

        viewModel.Confirmation.Should().Be(ConfirmationRequest.None);
        viewModel.Mode.Should().Be(RecorderMode.Recording);
    }

    // --- Capacidade da série ---

    [Fact]
    public void Series_KeepsMostRecentUpToCapacity()
    {
        var (viewModel, _, _, _) = Create(seriesCapacity: 3);
        viewModel.Record();

        for (var i = 1; i <= 5; i++)
        {
            viewModel.CaptureAngle(RecordingFixtures.Angle(i, 0), i * 100);
        }

        viewModel.Series.Should().HaveCount(3);
        viewModel.Series.Select(sample => sample.Roll).Should().Equal(3, 4, 5);
    }

    private static (RecorderViewModel ViewModel, FakeRecordingSession Session, FakeTicker Ticker, FakeClock Clock) Create(
        int seriesCapacity = RecorderViewModel.DefaultSeriesCapacity)
    {
        var session = new FakeRecordingSession();
        var ticker = new FakeTicker();
        var clock = new FakeClock();

        return (new RecorderViewModel(session, ticker, clock, seriesCapacity), session, ticker, clock);
    }
}
