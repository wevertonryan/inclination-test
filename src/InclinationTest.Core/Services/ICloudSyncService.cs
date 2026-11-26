using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using InclinationTest.Core.Persistence;
using InclinationTest.Core.Recording;

namespace InclinationTest.Core.Services;

public record CloudUser(string Id, string Email, string Name, DateTimeOffset LoggedInAt);

public record CloudAuthResult(bool Success, string? ErrorMessage = null, CloudUser? User = null, string? Token = null);

public record CloudSyncResult(bool Success, string RecordingId, string? RemoteId = null, string? ErrorMessage = null);

public interface ICloudSyncService
{
    bool IsAuthenticated { get; }
    CloudUser? CurrentUser { get; }
    bool AutoSyncEnabled { get; set; }
    string Endpoint { get; set; }
    event Action PullExecuted;
    IReadOnlySet<string> SyncedRecordingIds { get; }

    Task<CloudAuthResult> LoginAsync(string email, string password);
    Task<CloudAuthResult> RegisterAsync(string email, string password, string name);
    Task<string?> GetAuthTokenAsync();
    void Logout(IReportRepository? repository = null, bool clearLocalUserData = false);

    Task<CloudSyncResult> SyncRecordingAsync(string recordingId, string title, RecordingSummary summary, IReadOnlyList<RecordedSample> samples);
    Task<int> SyncAllPendingAsync(IReportRepository repository);
    Task<int> PullFromCloudAsync(IReportRepository repository);
    Task<bool> MarkAsDeletedInCloudAsync(string recordingId);
    bool IsSynced(string recordingId);

    event EventHandler<string>? SyncCompleted;
    event EventHandler? AuthStateChanged;
}
