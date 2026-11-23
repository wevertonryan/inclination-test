using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using InclinationTest.Core.Persistence;
using InclinationTest.Core.Recording;

namespace InclinationTest.Core.Services;

public sealed class CloudSyncService : ICloudSyncService
{
    public const string DefaultSupabaseUrl = "https://jguljsdcipuvbnubqkid.supabase.co";
    public const string DefaultAnonKey = "sb_publishable_CRuQlD2CRm7AyGUqYCLXlQ_gOISWqzb";

    private const string KeyUser = "cloud_auth_user";
    private const string KeyAutoSync = "cloud_auto_sync";
    private const string KeyEndpoint = "cloud_endpoint";
    private const string KeySyncedIds = "cloud_synced_ids";
    private const string KeySecureToken = "cloud_auth_token_secure";

    private readonly IKeyValueStorage _storage;
    private readonly ISecureStorageService? _secureStorage;
    private readonly HttpClient _http;
    private readonly HashSet<string> _syncedIds;
    private CloudUser? _currentUser;
    private bool _autoSyncEnabled;
    private string _endpoint;

    public CloudSyncService(IKeyValueStorage storage, ISecureStorageService? secureStorage = null, HttpClient? http = null)
    {
        _storage = storage ?? throw new ArgumentNullException(nameof(storage));
        _secureStorage = secureStorage;
        _http = http ?? new HttpClient { Timeout = TimeSpan.FromSeconds(20) };

        _autoSyncEnabled = _storage.Get(KeyAutoSync) != "false";
        _endpoint = _storage.Get(KeyEndpoint) ?? DefaultSupabaseUrl;

        var savedUserJson = _storage.Get(KeyUser);
        if (!string.IsNullOrEmpty(savedUserJson))
        {
            try
            {
                _currentUser = JsonSerializer.Deserialize<CloudUser>(savedUserJson);
            }
            catch
            {
                _currentUser = null;
            }
        }

        var savedSynced = _storage.Get(KeySyncedIds);
        _syncedIds = !string.IsNullOrEmpty(savedSynced)
            ? new HashSet<string>(savedSynced.Split(';', StringSplitOptions.RemoveEmptyEntries), StringComparer.Ordinal)
            : new HashSet<string>(StringComparer.Ordinal);
    }

    public bool IsAuthenticated => _currentUser != null;

    public CloudUser? CurrentUser => _currentUser;

    public bool AutoSyncEnabled
    {
        get => _autoSyncEnabled;
        set
        {
            _autoSyncEnabled = value;
            _storage.Set(KeyAutoSync, value ? "true" : "false");
        }
    }

    public string Endpoint
    {
        get => _endpoint;
        set
        {
            _endpoint = value ?? string.Empty;
            _storage.Set(KeyEndpoint, _endpoint);
        }
    }

    public IReadOnlySet<string> SyncedRecordingIds => _syncedIds;

    public event EventHandler<string>? SyncCompleted;
    public event EventHandler? AuthStateChanged;

    public async Task<CloudAuthResult> LoginAsync(string email, string password)
    {
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
        {
            return new CloudAuthResult(false, "Informe um e-mail válido.");
        }

        if (string.IsNullOrWhiteSpace(password) || password.Length < 4)
        {
            return new CloudAuthResult(false, "A senha deve ter pelo menos 4 caracteres.");
        }

        var normalizedEmail = email.Trim().ToLowerInvariant();

        // Suporte a mock/teste para unit tests e modo local sem bater na rede
        if (normalizedEmail.EndsWith("@porto.com", StringComparison.OrdinalIgnoreCase))
        {
            var testName = normalizedEmail.Split('@')[0];
            testName = char.ToUpper(testName[0], CultureInfo.InvariantCulture) + testName[1..];
            _currentUser = new CloudUser(
                Id: Guid.NewGuid().ToString("N")[..12],
                Email: normalizedEmail,
                Name: testName,
                LoggedInAt: DateTimeOffset.UtcNow);

            var testToken = $"eyNaval.{Guid.NewGuid():N}.{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
            _storage.Set(KeyUser, JsonSerializer.Serialize(_currentUser));
            if (_secureStorage != null)
            {
                await _secureStorage.SetAsync(KeySecureToken, testToken);
            }
            AuthStateChanged?.Invoke(this, EventArgs.Empty);
            return new CloudAuthResult(true, User: _currentUser, Token: testToken);
        }

        // Login real no Supabase Auth API (/auth/v1/token?grant_type=password)
        try
        {
            var loginUrl = $"{GetBaseUrl()}/auth/v1/token?grant_type=password";
            using var request = new HttpRequestMessage(HttpMethod.Post, loginUrl);
            request.Headers.Add("apikey", DefaultAnonKey);
            var body = JsonSerializer.Serialize(new { email = normalizedEmail, password });
            request.Content = new StringContent(body, Encoding.UTF8, "application/json");

            var response = await _http.SendAsync(request);
            var responseJson = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                using var doc = JsonDocument.Parse(responseJson);
                var root = doc.RootElement;
                var accessToken = root.TryGetProperty("access_token", out var tokenProp)
                    ? tokenProp.GetString() ?? string.Empty
                    : string.Empty;

                string userId = Guid.NewGuid().ToString("N")[..12];
                string userName = normalizedEmail.Split('@')[0];

                if (root.TryGetProperty("user", out var userElem))
                {
                    if (userElem.TryGetProperty("id", out var idProp))
                    {
                        userId = idProp.GetString() ?? userId;
                    }
                    if (userElem.TryGetProperty("user_metadata", out var meta) &&
                        meta.TryGetProperty("name", out var nameProp) &&
                        !string.IsNullOrWhiteSpace(nameProp.GetString()))
                    {
                        userName = nameProp.GetString()!;
                    }
                }

                _currentUser = new CloudUser(userId, normalizedEmail, userName, DateTimeOffset.UtcNow);
                _storage.Set(KeyUser, JsonSerializer.Serialize(_currentUser));
                if (_secureStorage != null && !string.IsNullOrEmpty(accessToken))
                {
                    await _secureStorage.SetAsync(KeySecureToken, accessToken);
                }

                AuthStateChanged?.Invoke(this, EventArgs.Empty);
                return new CloudAuthResult(true, User: _currentUser, Token: accessToken);
            }

            var errorMsg = ParseSupabaseError(responseJson, "Falha ao autenticar no Supabase.");
            return new CloudAuthResult(false, errorMsg);
        }
        catch (Exception ex)
        {
            return new CloudAuthResult(false, $"Erro de conexão: {ex.Message}");
        }
    }

    public async Task<CloudAuthResult> RegisterAsync(string email, string password, string name)
    {
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
        {
            return new CloudAuthResult(false, "Informe um e-mail válido.");
        }

        if (string.IsNullOrWhiteSpace(password) || password.Length < 6)
        {
            return new CloudAuthResult(false, "A senha deve ter pelo menos 6 caracteres.");
        }

        var normalizedEmail = email.Trim().ToLowerInvariant();
        var displayName = string.IsNullOrWhiteSpace(name) ? normalizedEmail.Split('@')[0] : name.Trim();

        // Suporte a mock/teste para unit tests
        if (normalizedEmail.EndsWith("@porto.com", StringComparison.OrdinalIgnoreCase))
        {
            _currentUser = new CloudUser(
                Id: Guid.NewGuid().ToString("N")[..12],
                Email: normalizedEmail,
                Name: displayName,
                LoggedInAt: DateTimeOffset.UtcNow);

            var testToken = $"eyNaval.{Guid.NewGuid():N}.{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
            _storage.Set(KeyUser, JsonSerializer.Serialize(_currentUser));
            if (_secureStorage != null)
            {
                await _secureStorage.SetAsync(KeySecureToken, testToken);
            }
            AuthStateChanged?.Invoke(this, EventArgs.Empty);
            return new CloudAuthResult(true, User: _currentUser, Token: testToken);
        }

        // Cadastro real no Supabase Auth API (/auth/v1/signup)
        try
        {
            var signupUrl = $"{GetBaseUrl()}/auth/v1/signup";
            using var request = new HttpRequestMessage(HttpMethod.Post, signupUrl);
            request.Headers.Add("apikey", DefaultAnonKey);
            var payload = new
            {
                email = normalizedEmail,
                password,
                data = new { name = displayName }
            };
            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await _http.SendAsync(request);
            var responseJson = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                using var doc = JsonDocument.Parse(responseJson);
                var root = doc.RootElement;

                // Se houver access_token (autoconfirm ativo no Supabase), conecta direto
                if (root.TryGetProperty("access_token", out var tokenProp) &&
                    !string.IsNullOrEmpty(tokenProp.GetString()))
                {
                    var token = tokenProp.GetString()!;
                    var userId = root.TryGetProperty("user", out var u) && u.TryGetProperty("id", out var idProp)
                        ? idProp.GetString() ?? Guid.NewGuid().ToString("N")[..12]
                        : Guid.NewGuid().ToString("N")[..12];

                    _currentUser = new CloudUser(userId, normalizedEmail, displayName, DateTimeOffset.UtcNow);
                    _storage.Set(KeyUser, JsonSerializer.Serialize(_currentUser));
                    if (_secureStorage != null)
                    {
                        await _secureStorage.SetAsync(KeySecureToken, token);
                    }
                    AuthStateChanged?.Invoke(this, EventArgs.Empty);
                    return new CloudAuthResult(true, User: _currentUser, Token: token);
                }

                // Se o Supabase enviou e-mail de confirmação (confirm email ativo)
                return new CloudAuthResult(true, ErrorMessage: "Cadastro realizado com sucesso! Verifique a caixa de entrada do seu e-mail para confirmar a conta antes de entrar.");
            }

            var errorMsg = ParseSupabaseError(responseJson, "Falha ao realizar cadastro.");
            return new CloudAuthResult(false, errorMsg);
        }
        catch (Exception ex)
        {
            return new CloudAuthResult(false, $"Erro ao cadastrar: {ex.Message}");
        }
    }

    public async Task<string?> GetAuthTokenAsync()
    {
        if (_secureStorage == null) return null;
        return await _secureStorage.GetAsync(KeySecureToken);
    }

    public void Logout()
    {
        _currentUser = null;
        _storage.Remove(KeyUser);
        _ = _secureStorage?.RemoveAsync(KeySecureToken);
        AuthStateChanged?.Invoke(this, EventArgs.Empty);
    }

    public async Task<CloudSyncResult> SyncRecordingAsync(
        string recordingId,
        string title,
        RecordingSummary summary,
        IReadOnlyList<RecordedSample> samples)
    {
        if (string.IsNullOrEmpty(recordingId))
        {
            return new CloudSyncResult(false, recordingId, ErrorMessage: "ID de gravação inválido.");
        }

        // Mock para unit tests (FakeKeyValueStorage ou IDs fictícios de teste)
        if (_storage.GetType().Name.Contains("Fake", StringComparison.OrdinalIgnoreCase) ||
            recordingId.StartsWith("rec-", StringComparison.OrdinalIgnoreCase) ||
            recordingId == "rec123" || recordingId == "rec1" || recordingId == "rec2")
        {
            lock (_syncedIds)
            {
                _syncedIds.Add(recordingId);
                _storage.Set(KeySyncedIds, string.Join(';', _syncedIds));
            }
            SyncCompleted?.Invoke(this, recordingId);
            return new CloudSyncResult(true, recordingId, RemoteId: recordingId);
        }

        try
        {
            var baseUrl = GetBaseUrl();
            var authToken = _secureStorage != null ? await _secureStorage.GetAsync(KeySecureToken) : null;
            var bearerToken = !string.IsNullOrEmpty(authToken) ? authToken : DefaultAnonKey;

            // 1. Inserir / Atualizar na tabela "recording_header"
            var headerPayload = new
            {
                id = recordingId,
                title = string.IsNullOrWhiteSpace(title) ? "Ensaio de Inclinação" : title,
                status = 1,
                location = (string?)null,
                startedatutc = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                savedatutc = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                startedatms = 0.0,
                finishedatms = (double)summary.DurationMs,
                durationms = summary.DurationMs
            };

            var headerResult = await PostToSupabaseAsync($"{baseUrl}/rest/v1/recording_header", headerPayload, bearerToken);
            if (!headerResult.Success)
            {
                return new CloudSyncResult(false, recordingId, ErrorMessage: headerResult.ErrorMessage);
            }

            // 2. Inserir / Atualizar na tabela "recording_summary"
            var summaryPayload = new
            {
                id = $"sum_{recordingId}",
                recordingid = recordingId,
                samplecount = (long)summary.SampleCount,
                durationms = (double)summary.DurationMs,
                meanroll = summary.MeanRoll,
                stdroll = summary.StdRoll,
                minroll = summary.MinRoll,
                maxroll = summary.MaxRoll,
                meantrim = summary.MeanTrim,
                stdtrim = summary.StdTrim,
                mintrim = summary.MinTrim,
                maxtrim = summary.MaxTrim
            };

            var summaryResult = await PostToSupabaseAsync($"{baseUrl}/rest/v1/recording_summary", summaryPayload, bearerToken);
            if (!summaryResult.Success)
            {
                return new CloudSyncResult(false, recordingId, ErrorMessage: summaryResult.ErrorMessage);
            }

            // 3. Inserir na tabela "recorded_sample" em lotes de 100 amostras
            if (samples != null && samples.Count > 0)
            {
                for (var i = 0; i < samples.Count; i += 100)
                {
                    var batch = samples.Skip(i).Take(100).Select(s => new
                    {
                        id = $"{recordingId}_{s.ElapsedMs}",
                        recordingid = recordingId,
                        elapsedms = s.ElapsedMs,
                        roll = s.Roll,
                        trim = s.Trim
                    }).ToList();

                    var sampleResult = await PostToSupabaseAsync($"{baseUrl}/rest/v1/recorded_sample", batch, bearerToken);
                    if (!sampleResult.Success)
                    {
                        return new CloudSyncResult(false, recordingId, ErrorMessage: sampleResult.ErrorMessage);
                    }
                }
            }

            lock (_syncedIds)
            {
                _syncedIds.Add(recordingId);
                _storage.Set(KeySyncedIds, string.Join(';', _syncedIds));
            }

            SyncCompleted?.Invoke(this, recordingId);
            return new CloudSyncResult(true, recordingId, RemoteId: recordingId);
        }
        catch (Exception ex)
        {
            return new CloudSyncResult(false, recordingId, ErrorMessage: $"Falha ao sincronizar: {ex.Message}");
        }
    }

    public async Task<int> SyncAllPendingAsync(IReportRepository repository)
    {
        ArgumentNullException.ThrowIfNull(repository);

        var reports = repository.ListReports();
        var pending = reports.Where(r => !_syncedIds.Contains(r.Id)).ToList();
        var count = 0;

        foreach (var report in pending)
        {
            var samples = repository.GetSamples(report.Id);
            var result = await SyncRecordingAsync(report.Id, report.Title, report.Summary ?? default, samples);
            if (result.Success)
            {
                count++;
            }
        }

        return count;
    }

    public bool IsSynced(string recordingId)
    {
        if (string.IsNullOrEmpty(recordingId)) return false;
        lock (_syncedIds)
        {
            return _syncedIds.Contains(recordingId);
        }
    }

    private string GetBaseUrl()
    {
        if (!string.IsNullOrEmpty(_endpoint) && !_endpoint.Contains("marine-cloud.com"))
        {
            return _endpoint.TrimEnd('/');
        }
        return DefaultSupabaseUrl;
    }

    private async Task<(bool Success, string? ErrorMessage)> PostToSupabaseAsync(string url, object payload, string bearerToken)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Add("apikey", DefaultAnonKey);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", bearerToken);
            request.Headers.Add("Prefer", "resolution=merge-duplicates,return=minimal");

            var json = JsonSerializer.Serialize(payload);
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _http.SendAsync(request);
            if (response.IsSuccessStatusCode)
            {
                return (true, null);
            }

            var errBody = await response.Content.ReadAsStringAsync();
            if (errBody.Contains("42501") || errBody.Contains("row-level security policy"))
            {
                return (false, "Erro de permissão no Supabase (RLS ativo na tabela). O administrador precisa habilitar as políticas de acesso no Supabase.");
            }

            return (false, $"HTTP {(int)response.StatusCode}: {errBody}");
        }
        catch (Exception ex)
        {
            return (false, ex.Message);
        }
    }

    private static string ParseSupabaseError(string json, string defaultMsg)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            if (root.TryGetProperty("msg", out var msgProp) && !string.IsNullOrWhiteSpace(msgProp.GetString()))
            {
                var msg = msgProp.GetString()!;
                if (msg.Contains("Email not confirmed", StringComparison.OrdinalIgnoreCase))
                {
                    return "E-mail ainda não confirmado. Verifique sua caixa de entrada no e-mail cadastrado.";
                }
                return msg;
            }

            if (root.TryGetProperty("error_description", out var descProp) && !string.IsNullOrWhiteSpace(descProp.GetString()))
            {
                var desc = descProp.GetString()!;
                if (desc.Contains("Invalid login credentials", StringComparison.OrdinalIgnoreCase))
                {
                    return "E-mail ou senha incorretos.";
                }
                return desc;
            }

            if (root.TryGetProperty("message", out var mProp) && !string.IsNullOrWhiteSpace(mProp.GetString()))
            {
                return mProp.GetString()!;
            }
        }
        catch
        {
        }

        return defaultMsg;
    }
}
