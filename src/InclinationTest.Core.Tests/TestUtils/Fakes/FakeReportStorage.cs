using InclinationTest.Core.Persistence;

namespace InclinationTest.Core.Tests.TestUtils.Fakes;

/// <summary>Armazenamento em memória com a mesma semântica de arquivos do App.</summary>
public sealed class FakeReportStorage : IReportStorage
{
    private readonly Dictionary<string, string> _files = new(StringComparer.Ordinal);

    public IReadOnlyList<string> List(string pattern)
    {
        var suffix = pattern.TrimStart('*');

        return _files.Keys
            .Where(name => name.EndsWith(suffix, StringComparison.Ordinal))
            .OrderBy(name => name, StringComparer.Ordinal)
            .ToList();
    }

    public bool Exists(string name) => _files.ContainsKey(name);

    public string ReadAllText(string name)
        => _files.TryGetValue(name, out var content)
            ? content
            : throw new FileNotFoundException(name);

    public void WriteAllText(string name, string content) => _files[name] = content;

    public void AppendText(string name, string content)
        => _files[name] = (_files.TryGetValue(name, out var current) ? current : string.Empty) + content;

    public void Delete(string name) => _files.Remove(name);
}
