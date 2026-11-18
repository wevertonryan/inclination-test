using System.Threading.Tasks;
using FluentAssertions;
using InclinationTest.Core.Persistence;
using InclinationTest.Core.Recording;
using InclinationTest.Core.Services;
using InclinationTest.Core.Tests.TestUtils.Fakes;
using Xunit;

namespace InclinationTest.Core.Tests.Services;

public class CloudSyncServiceTests
{
    [Fact]
    public async Task Login_WithValidCredentials_SucceedsAndSetsCurrentUser()
    {
        var storage = new FakeKeyValueStorage();
        var service = new CloudSyncService(storage);

        var result = await service.LoginAsync("marinheiro@porto.com", "senha123");

        result.Success.Should().BeTrue();
        service.IsAuthenticated.Should().BeTrue();
        service.CurrentUser.Should().NotBeNull();
        service.CurrentUser!.Email.Should().Be("marinheiro@porto.com");
    }

    [Fact]
    public async Task Login_WithInvalidEmail_Fails()
    {
        var storage = new FakeKeyValueStorage();
        var service = new CloudSyncService(storage);

        var result = await service.LoginAsync("invalido", "senha123");

        result.Success.Should().BeFalse();
        service.IsAuthenticated.Should().BeFalse();
        result.ErrorMessage.Should().Contain("e-mail válido");
    }

    [Fact]
    public async Task Login_WithShortPassword_Fails()
    {
        var storage = new FakeKeyValueStorage();
        var service = new CloudSyncService(storage);

        var result = await service.LoginAsync("teste@porto.com", "12");

        result.Success.Should().BeFalse();
        service.IsAuthenticated.Should().BeFalse();
        result.ErrorMessage.Should().Contain("4 caracteres");
    }

    [Fact]
    public async Task Logout_ClearsCurrentUser()
    {
        var storage = new FakeKeyValueStorage();
        var service = new CloudSyncService(storage);
        await service.LoginAsync("marinheiro@porto.com", "senha123");

        service.Logout();

        service.IsAuthenticated.Should().BeFalse();
        service.CurrentUser.Should().BeNull();
    }

    [Fact]
    public async Task Login_WithSecureStorage_SavesTokenInSecureStorage()
    {
        var storage = new FakeKeyValueStorage();
        var secureStorage = new FakeSecureStorageService();
        var service = new CloudSyncService(storage, secureStorage);

        var result = await service.LoginAsync("marinheiro@porto.com", "senha123");

        result.Success.Should().BeTrue();
        result.Token.Should().NotBeNullOrEmpty();

        var storedToken = await service.GetAuthTokenAsync();
        storedToken.Should().Be(result.Token);

        service.Logout();
        var tokenAfterLogout = await service.GetAuthTokenAsync();
        tokenAfterLogout.Should().BeNull();
    }

    [Fact]
    public async Task SyncRecording_MarksAsSyncedAndFiresEvent()
    {
        var storage = new FakeKeyValueStorage();
        var service = new CloudSyncService(storage);
        var eventFired = false;
        string? firedId = null;

        service.SyncCompleted += (_, id) =>
        {
            eventFired = true;
            firedId = id;
        };

        var summary = new RecordingSummary(1000, 10, 0, 0, 0, 0, 0, 0, 0, 0);
        var samples = new[] { new RecordedSample(0, 1.0, 0.5) };

        var result = await service.SyncRecordingAsync("rec123", "Ensaio Alpha", summary, samples);

        result.Success.Should().BeTrue();
        service.IsSynced("rec123").Should().BeTrue();
        eventFired.Should().BeTrue();
        firedId.Should().Be("rec123");
    }

    [Fact]
    public async Task SyncAllPending_SyncsAllUnsyncedReports()
    {
        var storage = new FakeKeyValueStorage();
        var service = new CloudSyncService(storage);
        var repoStorage = new FakeReportStorage();
        var repo = new FileReportRepository(repoStorage);

        repo.CreateRecording("rec1", 0);
        repo.AppendSamples("rec1", new[] { new RecordedSample(0, 0.5, 0.2) });
        repo.SaveRecording("rec1", "Ensaio 1", new RecordingSummary(1000, 1, 0, 0, 0, 0, 0, 0, 0, 0), 1000);

        repo.CreateRecording("rec2", 1000);
        repo.AppendSamples("rec2", new[] { new RecordedSample(0, 1.5, 0.8) });
        repo.SaveRecording("rec2", "Ensaio 2", new RecordingSummary(2000, 1, 0, 0, 0, 0, 0, 0, 0, 0), 2000);

        var count = await service.SyncAllPendingAsync(repo);

        count.Should().Be(2);
        service.IsSynced("rec1").Should().BeTrue();
        service.IsSynced("rec2").Should().BeTrue();
    }
}
