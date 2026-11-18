namespace InclinationTest.Core.Services;

/// <summary>
/// Contrato para armazenamento criptografado seguro (Android KeyStore / Apple Keychain).
/// Utilizado para chaves, JWTs e tokens de autenticação que nunca devem residir em texto plano.
/// </summary>
public interface ISecureStorageService
{
    Task<string?> GetAsync(string key);
    Task SetAsync(string key, string value);
    Task RemoveAsync(string key);
}
