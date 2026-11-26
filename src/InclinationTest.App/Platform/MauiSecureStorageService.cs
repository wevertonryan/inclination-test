using InclinationTest.Core.Services;
using Microsoft.Maui.Storage;

namespace InclinationTest.App.Platform;

/// <summary>
/// Armazenamento criptografado nativo via <see cref="SecureStorage"/> do .NET MAUI.
/// No Android, cifra dados com AES-256 GCM e chave gerenciada pela Android KeyStore (hardware TEE/StrongBox).
/// </summary>
public sealed class MauiSecureStorageService : ISecureStorageService
{
    public Task<string?> GetAsync(string key) => SecureStorage.Default.GetAsync(key);

    public Task SetAsync(string key, string value) => SecureStorage.Default.SetAsync(key, value);

    public Task RemoveAsync(string key)
    {
        SecureStorage.Default.Remove(key);
        return Task.CompletedTask;
    }
}
