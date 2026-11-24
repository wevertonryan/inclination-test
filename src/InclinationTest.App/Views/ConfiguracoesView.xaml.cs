using System;
using System.Threading.Tasks;
using InclinationTest.Core.Persistence;
using InclinationTest.Core.Services;
using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.Controls;
using Microsoft.Maui.Graphics;
using Microsoft.Maui.Networking;

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

        // Ouvinte de conectividade: ao religar a internet, sincroniza automaticamente
        Connectivity.Current.ConnectivityChanged += OnConnectivityChanged;

        Loaded += (_, _) => UpdateCloudUi();
    }

    private void OnConnectivityChanged(object? sender, ConnectivityChangedEventArgs e)
    {
        if (e.NetworkAccess == NetworkAccess.Internet && _cloudSync.IsAuthenticated && _cloudSync.AutoSyncEnabled)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    await _cloudSync.SyncAllPendingAsync(_repository);
                    await _cloudSync.PullFromCloudAsync(_repository);
                    MainThread.BeginInvokeOnMainThread(UpdateCloudUi);
                }
                catch
                {
                }
            });
        }
    }

    private void UpdateCloudUi()
    {
        if (_cloudSync.IsAuthenticated)
        {
            LoggedOutView.IsVisible = false;
            LoggedInView.IsVisible = true;

            var userName = _cloudSync.CurrentUser?.Name;
            var email = _cloudSync.CurrentUser?.Email;

            LoggedUserNameLabel.Text = !string.IsNullOrWhiteSpace(userName) ? userName : "Operador Naval";
            LoggedUserEmailLabel.Text = email ?? string.Empty;

            AutoSyncSwitch.IsToggled = _cloudSync.AutoSyncEnabled;
            var count = _cloudSync.SyncedRecordingIds.Count;
            SyncStatusLabel.Text = count > 0
                ? $"{count} medições sincronizadas na nuvem"
                : "Nenhuma medição sincronizada ainda";
        }
        else
        {
            LoggedOutView.IsVisible = true;
            LoggedInView.IsVisible = false;
        }
    }

    private void OnOpenLoginTapped(object? sender, TappedEventArgs e)
        => OpenAuth(isRegister: false);

    private void OnOpenRegisterTapped(object? sender, TappedEventArgs e)
        => OpenAuth(isRegister: true);

    private void OpenAuth(bool isRegister)
    {
        _isRegisterMode = isRegister;
        AuthFeedbackLabel.IsVisible = false;
        EmailEntry.Text = string.Empty;
        PasswordEntry.Text = string.Empty;
        NameEntry.Text = string.Empty;

        if (_isRegisterMode)
        {
            AuthHeaderTitleLabel.Text = "Criar Conta";
            AuthFormTitleLabel.Text = "Criar uma conta";
            AuthFormSubtitleLabel.Text = "Cadastre-se para sincronizar seus ensaios com o Supabase";
            NameFieldContainer.IsVisible = true;
            AuthSubmitButtonLabel.Text = "Criar Conta";
            AuthToggleLink.Text = "Já tem uma conta? Toque para entrar.";
        }
        else
        {
            AuthHeaderTitleLabel.Text = "Entrar";
            AuthFormTitleLabel.Text = "Acesse sua conta";
            AuthFormSubtitleLabel.Text = "Entre para sincronizar seus ensaios com o Supabase";
            NameFieldContainer.IsVisible = false;
            AuthSubmitButtonLabel.Text = "Entrar";
            AuthToggleLink.Text = "Ainda não tem conta? Toque para cadastrar.";
        }

        AuthFullScreenOverlay.IsVisible = true;
        if (_isRegisterMode)
        {
            NameEntry.Focus();
        }
        else
        {
            EmailEntry.Focus();
        }
    }

    private void OnCloseAuthTapped(object? sender, TappedEventArgs e)
    {
        AuthFullScreenOverlay.IsVisible = false;
    }

    private void OnToggleAuthModeTapped(object? sender, TappedEventArgs e)
        => OpenAuth(!_isRegisterMode);

    private async void OnSubmitAuthTapped(object? sender, TappedEventArgs e)
    {
        var email = EmailEntry.Text?.Trim() ?? string.Empty;
        var pass = PasswordEntry.Text ?? string.Empty;
        var name = NameEntry.Text?.Trim() ?? string.Empty;

        AuthFeedbackLabel.IsVisible = false;

        if (_isRegisterMode)
        {
            AuthSubmitButtonLabel.Text = "Cadastrando...";
            var regResult = await _cloudSync.RegisterAsync(email, pass, name);
            AuthSubmitButtonLabel.Text = "Criar Conta";

            if (!regResult.Success)
            {
                AuthFeedbackLabel.TextColor = ResourceColor("Error", "#ffb4ab");
                AuthFeedbackLabel.Text = regResult.ErrorMessage ?? "Falha ao cadastrar no Supabase.";
                AuthFeedbackLabel.IsVisible = true;
                return;
            }

            if (regResult.User != null)
            {
                AuthFullScreenOverlay.IsVisible = false;
                UpdateCloudUi();
                await TriggerInitialSync();
                return;
            }

            AuthFeedbackLabel.TextColor = ResourceColor("Primary", "#00d2d3");
            AuthFeedbackLabel.Text = regResult.ErrorMessage ?? "Cadastro criado! Verifique seu e-mail para confirmar a conta.";
            AuthFeedbackLabel.IsVisible = true;
            OpenAuth(isRegister: false);
        }
        else
        {
            AuthSubmitButtonLabel.Text = "Entrando...";
            var result = await _cloudSync.LoginAsync(email, pass);
            AuthSubmitButtonLabel.Text = "Entrar";

            if (!result.Success)
            {
                AuthFeedbackLabel.TextColor = ResourceColor("Error", "#ffb4ab");
                AuthFeedbackLabel.Text = result.ErrorMessage ?? "Falha na autenticação.";
                AuthFeedbackLabel.IsVisible = true;
                return;
            }

            AuthFullScreenOverlay.IsVisible = false;
            UpdateCloudUi();
            await TriggerInitialSync();
        }
    }

    private async Task TriggerInitialSync()
    {
        try
        {
            // Ao logar: baixa ensaios existentes na nuvem e sobe eventuais medições locais
            await _cloudSync.PullFromCloudAsync(_repository);
            if (_cloudSync.AutoSyncEnabled)
            {
                await _cloudSync.SyncAllPendingAsync(_repository);
            }
            MainThread.BeginInvokeOnMainThread(UpdateCloudUi);
        }
        catch
        {
            await Application.Current.Windows[0].Page!.DisplayAlert(
                "Erro de Sincronização",
                "Houve um erro ao sincronizar os dados da nuvem para seu dispositivo!",
                "Ok");
        }
    }

    private void OnAutoSyncToggled(object? sender, ToggledEventArgs e)
    {
        _cloudSync.AutoSyncEnabled = e.Value;
    }

    private async void OnSyncNowTapped(object? sender, TappedEventArgs e)
    {
        SyncStatusLabel.Text = "Sincronizando com a nuvem Supabase...";
        try
        {
            var pulled = await _cloudSync.PullFromCloudAsync(_repository);
            var pushed = await _cloudSync.SyncAllPendingAsync(_repository);
            UpdateCloudUi();
            SyncStatusLabel.Text = $"Sincronizado! {pulled} baixados, {pushed} enviados.";
        }
        catch (Exception ex)
        {
            SyncStatusLabel.Text = $"Erro ao sincronizar: {ex.Message}";
        }
    }

    private async void OnLogoutTapped(object? sender, TappedEventArgs e)
    {
        var confirmed = await (Application.Current?.Windows.Count > 0 && Application.Current.Windows[0].Page != null
            ? Application.Current.Windows[0].Page!.DisplayAlert(
                "Desconectar da Conta",
                "Deseja sair da sua conta? Suas medições salvas na nuvem permanecem seguras.",
                "Desconectar",
                "Cancelar")
            : Task.FromResult(true));

        if (confirmed)
        {
            _cloudSync.Logout(_repository, clearLocalUserData: false);
            UpdateCloudUi();
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
