namespace InclinationTest.Core.Services;

public interface IKeyValueStorage
{
    string? Get(string key);
    void Set(string key, string value);
    void Remove(string key);
}
