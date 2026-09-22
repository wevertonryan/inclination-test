# Documentação Técnica — Inclination Test

Documentação técnica/de desenvolvimento do projeto. Para visão de produto, backlog, sprints e marcos, ver [`README.md`](README.md).

## 1. Visão geral

O **Inclination Test** é um aplicativo móvel (.NET MAUI) para automatizar a Prova de Inclinação e a Prova de Mar de embarcações, usando os sensores do celular (acelerômetro, giroscópio, magnetômetro) para medir o ângulo de inclinação.

Plataforma-alvo: **Android** (.NET 10).

## 2. Stack e ferramentas

| Item | Tecnologia |
|---|---|
| Linguagem | C# (.NET 10) |
| UI | .NET MAUI (`net10.0-android`) |
| Arquitetura | MVVM |
| Testes | xUnit |
| DI | Microsoft.Extensions.DependencyInjection (nativa do MAUI) |
| Solução | `InclinationTest.slnx` |

## 3. Estrutura de pastas

```
InclinationTest.slnx
src/
  InclinationTest/          # App MAUI: Views, ViewModels, Platforms, Resources (net10.0-android)
  InclinationTest.Core/     # Models, serviços e lógica de processamento (net10.0 puro)
tests/
  InclinationTest.Tests/    # Testes xUnit (net10.0)
```

- `InclinationTest/` — camadas View e ViewModel do MVVM. Depende de MAUI (não testável headless).
- `InclinationTest.Core/` — a camada Model/serviços do MVVM. Código puro sem UI, testável na CLI sem emulador.
- `InclinationTest.Tests/` — projeto xUnit que referencia o `Core`.

O projeto MAUI referencia o `Core` via `ProjectReference`; o projeto de testes referencia o mesmo `Core`. Lógica única, usada pelo app e coberta por testes.

## 4. Dependências (NuGet)

### Instalar uma dependência

```bash
dotnet add src/InclinationTest/InclinationTest.csproj package <NomeDoPacote>
dotnet add src/InclinationTest/InclinationTest.csproj package <NomeDoPacote> --version 1.2.3
```

O `dotnet add package` já edita o `.csproj` e restaura automaticamente.

### Restaurar (instalar as já declaradas)

```bash
dotnet restore
```

### Listar dependências

```bash
dotnet list src/InclinationTest/InclinationTest.csproj package
dotnet list src/InclinationTest/InclinationTest.csproj package --outdated      # desatualizados
dotnet list src/InclinationTest/InclinationTest.csproj package --vulnerable    # com vulnerabilidades
```

(Pode-se rodar `dotnet list package` dentro da pasta do projeto, sem o caminho.)

## 5. Ambiente de testes

**Por que existe o `InclinationTest.Core`?** Um projeto MAUI é `net10.0-android` e precisa de runtime/emulador Android para ser executado — não dá para rodar testes xUnit headless nele. Por isso a lógica de cálculo/filtragem/calibração fica no `Core` (`net10.0` puro), onde tanto o app quanto o projeto de testes podem usá-la.

### Rodar os testes

```bash
dotnet test                          # testa o projeto na pasta atual ou a solution
dotnet test tests/InclinationTest.Tests/InclinationTest.Tests.csproj
```

## 6. Arquitetura MVVM + Core

```
View (XAML/MAUI) ⇄ ViewModel ⇄ Model/Serviços (Core)
```

- **View** e **ViewModel** ficam no projeto MAUI (dependem de `ContentPage`, `ICommand`, navegação).
- **Model/serviços** (cálculos, filtragem, calibração, leitura de sensores) ficam no `Core`.
- **DI** é registrada no `MauiProgram.cs`:

```csharp
builder.Services.AddSingleton<MeuServicoDoCore>();
```

## 7. Fluxo para adicionar lógica + teste

1. Criar a classe no `src/InclinationTest.Core/` (ex.: `FilterService`, `SensorCalibration`).
2. No app MAUI, usar com `using InclinationTest.Core;` e registrar no DI quando necessário (`MauiProgram.cs`).
3. No `tests/InclinationTest.Tests/`, escrever os testes para a mesma classe.
4. Rodar `dotnet test` para validar.

> Não há acoplamento manual entre os projetos: a `ProjectReference` já deixa o `Core` acessível tanto ao app quanto aos testes.

## 8. Comandos úteis

| Ação | Comando |
|---|---|
| Rodar testes | `dotnet test` |
| Restaurar dependências | `dotnet restore` |
| Build da solution | `dotnet build InclinationTest.slnx` |
| Listar pacotes | `dotnet list package` |
| Adicionar pacote | `dotnet add <projeto> package <pacote>` |
| Rodar o app Android | `dotnet build -t:Run -f net10.0-android` (com dispositivo/emulador) |