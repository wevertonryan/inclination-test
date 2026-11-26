using System.Collections.Generic;
using InclinationTest.Core.Services;

namespace InclinationTest.Core.Tests.TestUtils.Fakes;

public sealed class FakeKeyValueStorage : IKeyValueStorage
{
    private readonly Dictionary<string, string> _values = new();

    public string? Get(string key) => _values.TryGetValue(key, out var value) ? value : null;

    public void Set(string key, string value) => _values[key] = value;

    public void Remove(string key) => _values.Remove(key);
}
