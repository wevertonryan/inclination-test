using InclinationTest.Core.Services;
using Microsoft.Maui.Storage;

namespace InclinationTest.App.Platform;

public sealed class MauiPreferencesKeyValueStorage : IKeyValueStorage
{
    public string? Get(string key) => Preferences.Default.Get(key, (string?)null);

    public void Set(string key, string value) => Preferences.Default.Set(key, value);

    public void Remove(string key) => Preferences.Default.Remove(key);
}
