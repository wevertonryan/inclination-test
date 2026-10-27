namespace InclinationTest.Core.Persistence;

/// <summary>
/// Armazenamento de arquivos texto usado pelo <see cref="FileReportRepository"/>.
/// O Core não conhece o sistema de arquivos do MAUI: o App implementa esta porta apontando
/// para <c>FileSystem.AppDataDirectory</c> e os testes usam uma implementação em memória.
/// Os nomes são relativos ao diretório de relatórios.
/// </summary>
public interface IReportStorage
{
    IReadOnlyList<string> List(string pattern);

    bool Exists(string name);

    string ReadAllText(string name);

    void WriteAllText(string name, string content);

    void AppendText(string name, string content);

    void Delete(string name);
}
