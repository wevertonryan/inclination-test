using System;
using System.Threading.Tasks;
using InclinationTest.Core.Persistence;
using InclinationTest.Core.Services;
using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.Controls;
using Microsoft.Maui.Graphics;
using UraniumUI.Icons.MaterialSymbols;

namespace InclinationTest.App.Views;

public partial class ConfiguracoesView : ContentView
{
    private readonly ICloudSyncService _cloudSync;
    private readonly IReportRepository _repository;
    private bool _isRegisterMode;

    public ConfiguracoesView(ICloudSyncService cloudSync, IReportRepository repository)
    {
        InitializeComponent();

        _cloudSync = cloudSync ?? throw new ArgumentNullException(nameof(cloudSync));
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));

        _cloudSync.AuthStateChanged += (_, _) => MainThread.BeginInvokeOnMainThread(UpdateCloudUi);
        _cloudSync.SyncCompleted += (_, _) => MainThread.BeginInvokeOnMainThread(UpdateCloudUi);

        Loaded += (_, _) => UpdateCloudUi();
    }

    private void UpdateCloudUi()
    {
        if (_cloudSync.IsAuthenticated)
        {
            CloudStatusIcon.Text = MaterialOutlined.Cloud_done;
            CloudStatusIcon.TextColor = ResourceColor("Primary", "#48efef");
            var userName = _cloudSync.CurrentUser?.Name;
            var email = _cloudSync.CurrentUser?.Email;
            CloudAccountLabel.Text = !string.IsNullOrWhiteSpace(userName)
                ? $"Conectado: {userName} ({email})"
                : $"Conectado: {email}";
            CloudAccountLabel.TextColor = ResourceColor("Primary", "#48efef");
            CloudAuthActionLabel.Text = "DESCONECTAR";
            CloudAuthActionLabel.TextColor = ResourceColor("Error", "#ffb4ab");
            CloudAuthActionBorder.BackgroundColor = ResourceColor("SurfaceContainerHigh", "#252a32");
        }
        else
        {
            CloudStatusIcon.Text = MaterialOutlined.Cloud_off;
            CloudStatusIcon.TextColor = ResourceColor("Outline", "#859493");
            CloudAccountLabel.Text = "Modo Local (Offline) — Login opcional";
            CloudAccountLabel.TextColor = ResourceColor("OnSurfaceVariant", "#bacac9");
            CloudAuthActionLabel.Text = "CONECTAR";
            CloudAuthActionLabel.TextColor = ResourceColor("OnPrimaryContainer", "#005556");
            CloudAuthActionBorder.BackgroundColor = ResourceColor("PrimaryContainer", "#00d2d3");
        }

        AutoSyncSwitch.IsToggled = _cloudSync.AutoSyncEnabled;
        var count = _cloudSync.SyncedRecordingIds.Count;
        SyncCountLabel.Text = count > 0
            ? $"{count} medições sincronizadas na nuvem Supabase"
            : "Nenhuma medição sincronizada ainda";
    }

    private void OnAuthActionTapped(object? sender, TappedEventArgs e)
    {
        if (_cloudSync.IsAuthenticated)
        {
            _cloudSync.Logout();
            UpdateCloudUi();
        }
        else
        {
            SetAuthMode(false);
            EmailEntry.Text = string.Empty;
            PasswordEntry.Text = string.Empty;
            NameEntry.Text = string.Empty;
            LoginErrorLabel.IsVisible = false;
            LoginOverlay.IsVisible = true;
            LoginOverlay.Opacity = 0;
            _ = LoginOverlay.FadeTo(1, 150);
            EmailEntry.Focus();
        }
    }

    private void OnSelectLoginTabTapped(object? sender, TappedEventArgs e)
        => SetAuthMode(false);

    private void OnSelectRegisterTabTapped(object? sender, TappedEventArgs e)
        => SetAuthMode(true);

    private void OnToggleAuthModeTapped(object? sender, TappedEventArgs e)
        => SetAuthMode(!_isRegisterMode);

    private void SetAuthMode(bool isRegister)
    {
        _isRegisterMode = isRegister;
        LoginErrorLabel.IsVisible = false;

        var primary = ResourceColor("Primary", "#00d2d3");
        var onPrimary = ResourceColor("OnPrimary", "#0e141b");
        var onSurfaceVariant = ResourceColor("OnSurfaceVariant", "#bacac9");

        if (_isRegisterMode)
        {
            TabRegisterBorder.BackgroundColor = primary;
            TabRegisterLabel.TextColor = onPrimary;
            TabLoginBorder.BackgroundColor = Colors.Transparent;
            TabLoginLabel.TextColor = onSurfaceVariant;
            NameContainer.IsVisible = true;
            SubmitAuthLabel.Text = "Criar Conta";
            ToggleModeLink.Text = "Já tem uma conta? Toque para entrar.";
            ModalTitleLabel.Text = "Criar Conta Supabase";
        }
        else
        {
            TabLoginBorder.BackgroundColor = primary;
            TabLoginLabel.TextColor = onPrimary;
            TabRegisterBorder.BackgroundColor = Colors.Transparent;
            TabRegisterLabel.TextColor = onSurfaceVariant;
            NameContainer.IsVisible = false;
            SubmitAuthLabel.Text = "Entrar / Conectar";
            ToggleModeLink.Text = "Não tem uma conta? Toque para cadastrar.";
            ModalTitleLabel.Text = "Entrar na Conta";
        }
    }

    private async void OnCloseLoginTapped(object? sender, TappedEventArgs e)
    {
        await LoginOverlay.FadeTo(0, 120);
        LoginOverlay.IsVisible = false;
    }

    private async void OnSubmitLoginTapped(object? sender, TappedEventArgs e)
    {
        var email = EmailEntry.Text?.Trim() ?? string.Empty;
        var pass = PasswordEntry.Text ?? string.Empty;
        var name = NameEntry.Text?.Trim() ?? string.Empty;

        LoginErrorLabel.IsVisible = false;

        if (_isRegisterMode)
        {
            SubmitAuthLabel.Text = "Cadastrando...";
            var regResult = await _cloudSync.RegisterAsync(email, pass, name);
            SubmitAuthLabel.Text = "Criar Conta";

            if (!regResult.Success)
            {
                LoginErrorLabel.TextColor = ResourceColor("Error", "#ffb4ab");
                LoginErrorLabel.Text = regResult.ErrorMessage ?? "Falha ao cadastrar no Supabase.";
                LoginErrorLabel.IsVisible = true;
                return;
            }

            // Se o usuário foi autenticado diretamente (autoconfirm ativo no Supabase)
            if (regResult.User != null)
            {
                await CloseLoginModalAsync();
                UpdateCloudUi();
                TriggerPendingSyncIfEnabled();
                return;
            }

            // Se precisou enviar e-mail de confirmação
            LoginErrorLabel.TextColor = ResourceColor("Primary", "#00d2d3");
            LoginErrorLabel.Text = regResult.ErrorMessage ?? "Cadastro criado! Verifique seu e-mail para confirmar a conta.";
            LoginErrorLabel.IsVisible = true;
            SetAuthMode(false);
        }
        else
        {
            SubmitAuthLabel.Text = "Entrando...";
            var result = await _cloudSync.LoginAsync(email, pass);
            SubmitAuthLabel.Text = "Entrar / Conectar";

            if (!result.Success)
            {
                LoginErrorLabel.TextColor = ResourceColor("Error", "#ffb4ab");
                LoginErrorLabel.Text = result.ErrorMessage ?? "Falha na autenticação.";
                LoginErrorLabel.IsVisible = true;
                return;
            }

            await CloseLoginModalAsync();
            UpdateCloudUi();
            TriggerPendingSyncIfEnabled();
        }
    }

    private async Task CloseLoginModalAsync()
    {
        LoginErrorLabel.IsVisible = false;
        await LoginOverlay.FadeTo(0, 120);
        LoginOverlay.IsVisible = false;
    }

    private void TriggerPendingSyncIfEnabled()
    {
        if (_cloudSync.AutoSyncEnabled)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    await _cloudSync.SyncAllPendingAsync(_repository);
                    MainThread.BeginInvokeOnMainThread(UpdateCloudUi);
                }
                catch
                {
                }
            });
        }
    }

    private void OnAutoSyncToggled(object? sender, ToggledEventArgs e)
    {
        _cloudSync.AutoSyncEnabled = e.Value;
    }

    private async void OnSyncNowTapped(object? sender, TappedEventArgs e)
    {
        SyncCountLabel.Text = "Sincronizando com a nuvem Supabase...";
        try
        {
            var syncedCount = await _cloudSync.SyncAllPendingAsync(_repository);
            UpdateCloudUi();
            SyncCountLabel.Text = syncedCount > 0
                ? $"{syncedCount} novas medições sincronizadas no Supabase!"
                : "Todas as medições locais já estão sincronizadas no Supabase.";
        }
        catch (Exception ex)
        {
            SyncCountLabel.Text = $"Erro ao sincronizar: {ex.Message}";
        }
    }

    private static Color ResourceColor(string key, string fallbackHex)
    {
        if (Application.Current?.Resources.TryGetValue(key, out var raw) == true && raw is Color color)
        {
            return color;
        }

        return Color.FromArgb(fallbackHex);
    }
}
