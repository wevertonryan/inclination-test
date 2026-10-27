using InclinationTest.Core.Persistence;
using Microsoft.Maui.Storage;

namespace InclinationTest.App.Platform;

/// <summary>
/// <see cref="IReportStorage"/> sobre <c>FileSystem.AppDataDirectory/reports</c>.
/// Um cadeado só porque a escrita acontece na thread do <c>ThreadSerialExecutor</c> e a
/// leitura na thread de UI.
/// </summary>
public sealed class AppDataReportStorage : IReportStorage
{
    private readonly object _gate = new();
    private readonly string _root;

    public AppDataReportStorage()
    {
        _root = Path.Combine(FileSystem.AppDataDirectory, "reports");
        Directory.CreateDirectory(_root);
    }

    public IReadOnlyList<string> List(string pattern)
    {
        lock (_gate)
        {
            if (!Directory.Exists(_root))
            {
                return Array.Empty<string>();
            }

            return Directory.GetFiles(_root, pattern)
                .Select(Path.GetFileName)
                .Where(name => !string.IsNullOrEmpty(name))
                .Select(name => name!)
                .ToList();
        }
    }

    public bool Exists(string name)
    {
        lock (_gate)
        {
            return File.Exists(PathOf(name));
        }
    }

    public string ReadAllText(string name)
    {
        lock (_gate)
        {
            return File.ReadAllText(PathOf(name));
        }
    }

    public void WriteAllText(string name, string content)
    {
        lock (_gate)
        {
            File.WriteAllText(PathOf(name), content);
        }
    }

    public void AppendText(string name, string content)
    {
        lock (_gate)
        {
            File.AppendAllText(PathOf(name), content);
        }
    }

    public void Delete(string name)
    {
        lock (_gate)
        {
            var path = PathOf(name);

            if (File.Exists(path))
            {
                File.Delete(path);
            }
        }
    }

    private string PathOf(string name) => Path.Combine(_root, name);
}
