using System.Globalization;
using System.Text;
using InclinationTest.Core.Recording;

namespace InclinationTest.Core.Persistence;

/// <summary>
/// Repositório persistente: um par de arquivos por gravação, dentro do diretório exposto por
/// <see cref="IReportStorage"/>.
/// <para><c>{id}.hdr</c> — cabeçalho (<see cref="HeaderFormat"/>), reescrito ao salvar.</para>
/// <para><c>{id}.csv</c> — amostras em <c>elapsed;roll;trim</c>, só acrescentadas (append).</para>
/// As amostras ficam em disco a cada lote, então uma gravação interrompida continua legível.
/// </summary>
public sealed class FileReportRepository : IReportRepository
{
    private const string HeaderSuffix = ".hdr";
    private const string SamplesSuffix = ".csv";

    private readonly object _gate = new();
    private readonly IReportStorage _storage;
    private readonly Dictionary<string, RecordingHeader> _headers = new(StringComparer.Ordinal);
    private readonly Dictionary<string, HashSet<long>> _accepted = new(StringComparer.Ordinal);

    private bool _loaded;

    public FileReportRepository(IReportStorage storage)
        => _storage = storage ?? throw new ArgumentNullException(nameof(storage));

    public void CreateRecording(string id, double startedAtMs, string? location = null)
    {
        lock (_gate)
        {
            EnsureLoaded();

            if (_headers.ContainsKey(id))
            {
                return;
            }

            var header = new RecordingHeader(
                id,
                string.Empty,
                startedAtMs,
                null,
                0,
                RecordingStatus.Recording,
                null,
                location)
            {
                StartedAtUtc = DateTimeOffset.UtcNow,
            };

            _headers[id] = header;
            _accepted[id] = new HashSet<long>();

            _storage.WriteAllText(HeaderName(id), HeaderFormat.Write(header));
            _storage.WriteAllText(SamplesName(id), string.Empty);
        }
    }

    public void AppendSamples(string recordingId, IReadOnlyList<RecordedSample> samples)
    {
        lock (_gate)
        {
            EnsureLoaded();

            if (!_headers.TryGetValue(recordingId, out _))
            {
                throw new InvalidOperationException($"Recording '{recordingId}' does not exist.");
            }

            if (!_accepted.TryGetValue(recordingId, out var accepted))
            {
                accepted = new HashSet<long>();
                _accepted[recordingId] = accepted;
            }

            var builder = new StringBuilder();

            foreach (var sample in samples)
            {
                if (!accepted.Add(sample.ElapsedMs))
                {
                    continue;
                }

                builder.Append(sample.ElapsedMs.ToString(CultureInfo.InvariantCulture))
                    .Append(';')
                    .Append(sample.Roll.ToString("R", CultureInfo.InvariantCulture))
                    .Append(';')
                    .Append(sample.Trim.ToString("R", CultureInfo.InvariantCulture))
                    .Append('\n');
            }

            if (builder.Length > 0)
            {
                _storage.AppendText(SamplesName(recordingId), builder.ToString());
            }
        }
    }

    public void SaveRecording(string recordingId, string title, RecordingSummary summary, double finishedAtMs)
    {
        lock (_gate)
        {
            EnsureLoaded();

            if (!_headers.TryGetValue(recordingId, out var header))
            {
                throw new InvalidOperationException($"Recording '{recordingId}' does not exist.");
            }

            var saved = header with
            {
                Title = title,
                Status = RecordingStatus.Saved,
                FinishedAtMs = finishedAtMs,
                DurationMs = summary.DurationMs,
                Summary = summary,
                SavedAtUtc = DateTimeOffset.UtcNow,
            };

            _headers[recordingId] = saved;
            _storage.WriteAllText(HeaderName(recordingId), HeaderFormat.Write(saved));
        }
    }

    public void DeleteRecording(string recordingId)
    {
        lock (_gate)
        {
            EnsureLoaded();

            _headers.Remove(recordingId);
            _accepted.Remove(recordingId);

            _storage.Delete(HeaderName(recordingId));
            _storage.Delete(SamplesName(recordingId));
        }
    }

    public IReadOnlyList<RecordingHeader> ListReports()
    {
        lock (_gate)
        {
            EnsureLoaded();

            return _headers.Values
                .Where(header => header.Status == RecordingStatus.Saved)
                .OrderByDescending(header => header.StartedAtMs)
                .ToList();
        }
    }

    public RecordingHeader? GetRecording(string recordingId)
    {
        lock (_gate)
        {
            EnsureLoaded();

            return _headers.TryGetValue(recordingId, out var header) ? header : null;
        }
    }

    public IReadOnlyList<RecordedSample> GetSamples(string recordingId)
    {
        lock (_gate)
        {
            EnsureLoaded();

            var name = SamplesName(recordingId);
            if (!_storage.Exists(name))
            {
                return Array.Empty<RecordedSample>();
            }

            var samples = new List<RecordedSample>();

            foreach (var line in _storage.ReadAllText(name).Split('\n'))
            {
                var trimmed = line.TrimEnd('\r');
                if (trimmed.Length == 0)
                {
                    continue;
                }

                var parts = trimmed.Split(';');
                if (parts.Length != 3)
                {
                    continue;
                }

                if (!long.TryParse(parts[0], NumberStyles.Integer, CultureInfo.InvariantCulture, out var elapsed)
                    || !double.TryParse(parts[1], NumberStyles.Float, CultureInfo.InvariantCulture, out var roll)
                    || !double.TryParse(parts[2], NumberStyles.Float, CultureInfo.InvariantCulture, out var trim))
                {
                    continue;
                }

                samples.Add(new RecordedSample(elapsed, roll, trim));
            }

            samples.Sort(static (left, right) => left.ElapsedMs.CompareTo(right.ElapsedMs));

            return samples;
        }
    }

    public IReadOnlyList<RecordingHeader> FindInterrupted()
    {
        lock (_gate)
        {
            EnsureLoaded();

            return _headers.Values
                .Where(header => header.Status == RecordingStatus.Recording)
                .ToList();
        }
    }

    private void EnsureLoaded()
    {
        if (_loaded)
        {
            return;
        }

        _loaded = true;

        foreach (var name in _storage.List("*" + HeaderSuffix))
        {
            try
            {
                var header = HeaderFormat.Read(_storage.ReadAllText(name));
                _headers[header.Id] = header;
                _accepted[header.Id] = new HashSet<long>();
            }
            catch (Exception)
            {
                // Cabeçalho corrompido (queda no meio da escrita) não pode derrubar a lista inteira.
            }
        }
    }

    private static string HeaderName(string id) => id + HeaderSuffix;

    private static string SamplesName(string id) => id + SamplesSuffix;
}
