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
            CloudAccountLabel.Text = $"Conectado: {_cloudSync.CurrentUser?.Email}";
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
            ? $"{count} medições sincronizadas na nuvem"
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
            EmailEntry.Text = string.Empty;
            PasswordEntry.Text = string.Empty;
            LoginErrorLabel.IsVisible = false;
            LoginOverlay.IsVisible = true;
            LoginOverlay.Opacity = 0;
            _ = LoginOverlay.FadeTo(1, 150);
            EmailEntry.Focus();
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

        var result = await _cloudSync.LoginAsync(email, pass);
        if (!result.Success)
        {
            LoginErrorLabel.Text = result.ErrorMessage ?? "Falha na autenticação.";
            LoginErrorLabel.IsVisible = true;
            return;
        }

        LoginErrorLabel.IsVisible = false;
        await LoginOverlay.FadeTo(0, 120);
        LoginOverlay.IsVisible = false;

        UpdateCloudUi();

        // Se houver medições locais pendentes, sincroniza automaticamente
        if (_cloudSync.AutoSyncEnabled)
        {
            _ = Task.Run(async () =>
            {
                await _cloudSync.SyncAllPendingAsync(_repository);
                MainThread.BeginInvokeOnMainThread(UpdateCloudUi);
            });
        }
    }

    private void OnAutoSyncToggled(object? sender, ToggledEventArgs e)
    {
        _cloudSync.AutoSyncEnabled = e.Value;
    }

    private async void OnSyncNowTapped(object? sender, TappedEventArgs e)
    {
        SyncCountLabel.Text = "Sincronizando com a nuvem...";
        try
        {
            var syncedCount = await _cloudSync.SyncAllPendingAsync(_repository);
            UpdateCloudUi();
            SyncCountLabel.Text = $"{syncedCount} novas medições sincronizadas!";
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
