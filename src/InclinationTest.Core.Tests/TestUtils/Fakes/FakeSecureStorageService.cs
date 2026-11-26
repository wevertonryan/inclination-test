using InclinationTest.Core.Services;

namespace InclinationTest.Core.Tests.TestUtils.Fakes;

public sealed class FakeSecureStorageService : ISecureStorageService
{
    private readonly Dictionary<string, string> _values = new(StringComparer.Ordinal);

    public Task<string?> GetAsync(string key)
    {
        _values.TryGetValue(key, out var val);
        return Task.FromResult<string?>(val);
    }

    public Task SetAsync(string key, string value)
    {
        _values[key] = value;
        return Task.CompletedTask;
    }

    public Task RemoveAsync(string key)
    {
        _values.Remove(key);
        return Task.CompletedTask;
    }
}
