# Documentação Técnica — Inclination Test

Documentação técnica/de desenvolvimento do projeto. Para visão de produto, backlog, sprints e marcos, veja [`README.md`](README.md).

## 1. Visão geral

O **Inclination Test** é um aplicativo móvel (.NET MAUI) para automatizar a Prova de Inclinação e a Prova de Mar de embarcações, usando os sensores do celular (lidos via `Microsoft.Maui.Devices.Sensors`, sensor `Accelerometer`) para medir o ângulo de inclinação.

Plataforma-alvo: **Android** (.NET 10 / .NET MAUI 10).

## Status atual do projeto

> **Última verificação: 27/10/2026.** Este status reflete o que existe no código hoje e é a
> fonte de verdade sobre o andamento. As demais seções descrevem o desenho-alvo; o que ainda
> não foi implementado está marcado como **Planejado** ao longo do documento.

**Estágio:** Épico 1 / **EP2** concluído — Sensores, Cálculos, Calibração, Filtragem de Ruído e
Testes. A interface foi migrada para o design system do Stitch: navegação completa (`AppShell` +
`MainPage` com `material:TabView` da UraniumUI, 5 abas inferiores), **Home** de gravação,
**Relatórios** (lista, busca/filtro, detalhe, dados brutos e exclusão) e **Calibragem** do
acelerômetro integrados; **Testes** e **Ajustes** seguem como telas visuais, sem dados fictícios.

A **gravação/persistência (Épico 2/3) está concluída nas 3 etapas** (1. testes → 2. código do
Core → 3. visual). A Etapa 1 escreveu os contratos e as suítes; a Etapa 2 implementou os corpos do
Core; a **Etapa 3** entregou a interface e a **persistência em arquivo**, então as gravações
sobrevivem a fechar o app. A suíte total (**235 testes**) está **verde**.


### Implementado

| Camada | O que existe |
|---|---|
| `Core/Models/` | `Vector3`, `MotionSample`, `Angles`, `Calibration` |
| `Core/Sensors/` | `ISensorService`, `SensorService`, `IAccelerometerSource`, `AccelerometerReading` (contratos em `Contracts/`) |
| `Core/Processing/` | `IFilter` (em `Contracts/`), `FilterService` (filtro EMA), `AngleConverter` |
| `Core/ViewModels/` | `InclinationViewModel` (Start/Stop/Calibrate, `OnSample`, `Error`); `RecorderViewModel` (máquina de estados, cronômetro, confirmação, série); `ReportsViewModel` (lista/abre/fecha relatórios); contratos `RecorderMode`, `ConfirmationRequest` (em `Contracts/`) e `ReportItem` (`Contracts/ReportItem.cs`) |
| `Core/Recording/` | `RecordingSession` (decimação 12 Hz, lotes de 2 s, pause/resume), `Statistics` (Welford), `RecordingWriter` (ponte gravador → repositório, **multi-gravação**, evento `Saved`), `ThreadSerialExecutor` (thread dedicada + fila); contratos em `Contracts/`: `IRecordingSession`, `ISerialExecutor`, `RecordedSample`, `RecordingSummary`, `RecordingOptions`, `RecordingEvents` |
| `Core/Persistence/` | `InMemoryReportRepository` (referência de semântica, usada pelos testes) e `FileReportRepository` (**persistência real** em `.hdr` + `.csv`); `HeaderFormat` (serialização texto do cabeçalho); contratos em `Contracts/`: `IReportRepository`, `IReportStorage`, `RecordingHeader`, `RecordingStatus` |
| `Core/Platform/` | `IClock`, `ITicker` (abstrações de tempo; produção no App, fakes nos testes) |
| `App` | `MauiProgram` (DI + UraniumUI + fontes Space Grotesk/Inter/JetBrains Mono/Material Symbols), `AppShell`, `Views/MainPage` (`material:TabView` com 5 abas), `Views/HomeView` (gravação integrada, inclinômetro + TRIM/ROLL + gráfico + modais), **`Views/RelatoriosView`** (cards, busca/filtro, detalhe, estatísticas, gráfico, dados brutos e exclusão), `Views/CalibragemView` (calibragem real do acelerômetro; demais sensores indicados como não identificados), `Views/TestesView`/`ConfiguracoesView` (visuais, sem dados fictícios), `Controls/InclinometerControl` e `RangeGaugeControl` (Skia), `Controls/CollapsibleTabView`, `Components/Features/ChartView` (LiveCharts2, streaming) e `ReportChartView` (relatório salvo, decimado), `RecordButton`, `RecordingBar`, `ScreenHeader`, `Platform/DispatcherTicker`, `Platform/SystemClock`, `Platform/AppDataReportStorage`, `Converters/` |
| Testes | **235** xUnit: `SensorService` 19, `FilterService` 13, `AngleConverter` 37, `InclinationViewModel` 26, `InclinationViewModelPublish` 3, `Statistics` 15, `RecordingSession` 33, `RecordingWriter` 7, `RecordingWriterMultiple` 3, `ThreadSerialExecutor` 4, `InMemoryReportRepository` 15, `FileReportRepository` 19, `ReportsViewModel` 9, `RecorderViewModel` 32 — **todos verdes** |

### Planejado (não implementado)

| Camada | Pendente |
|---|---|
| `Core/Persistence/` | Evolução opcional: `SqliteReportRepository` (`Microsoft.Data.Sqlite`) para consultas/índices. A semântica já é garantida por contrato e coberta por `FileReportRepository` |
| `App` | Telas reais de Testes e Configurações; exportação de PDF; sensores além do acelerômetro. A exclusão de relatórios já está implementada |
| Stack de UI | UraniumUI, LiveCharts2 e SkiaSharp **já em uso** (gráfico Trim × Roll, inclinômetro e gráfico de relatório) |
| Build | APK de **Debug** via GitHub Actions (`.github/workflows/apk.yml`, artifact `inclination-test-apk`); falta assinatura fixa e um perfil Release |

> A Prova de Mar / série temporal é, no `README.md`, **fora do escopo do MVP**. Ainda assim, por
> decisão do time, o **Core** da gravação (seção 7) já foi antecipado e implementado; a **interface**
> (seção 8) continua como desenho-alvo da Etapa 3.

## Roadmap das etapas — o que foi feito e o que falta

Legenda: ✅ concluído · ⬜ pendente.

### Épico 1 — Medição (concluído)

- ✅ **Sensores** — `IAccelerometerSource` + `SensorService` + adapter `MauiAccelerometerSource`.
- ✅ **Cálculo** — `AngleConverter` (roll ±180, trim ±90, com sinal; convenção MAUI em G).
- ✅ **Calibração** — offset de zero aplicado no `AngleConverter` (US-01).
- ✅ **Filtragem** — `FilterService` (EMA).
- ✅ **ViewModel** — `InclinationViewModel` (estado + `OnSample` como torneira da série).
- ✅ **Testes** — 95 testes verdes (SensorService, FilterService, AngleConverter, InclinationViewModel).

### Gravação / persistência (desenvolvida por TDD, em 3 etapas)

**Etapa 0 — Preparação da estrutura ✅**

- ✅ Criação dos contratos-esqueleto em `Core/Recording/`, `Core/Persistence/`, `Core/Platform/` e `Core/ViewModels/`.
- ✅ Reorganização em subpastas `Contracts/` por módulo (`Recording`, `Persistence`, `ViewModels`, `Sensors`, `Processing`), sem alterar namespaces.

**Etapa 1 — Testes (TDD "vermelho") ✅**

- ✅ Suítes escritas: `StatisticsTests` (15), `RecordingSessionTests` (33), `RecordingWriterTests` (7), `ThreadSerialExecutorTests` (4), `ReportRepositoryContractTests` (15) + `InMemoryReportRepositoryTests`, `RecorderViewModelTests` (32).
- ✅ Fakes de teste: `FakeClock`, `FakeTicker`, `InlineSerialExecutor`, `FakeRecordingSession`, `SpyReportRepository`.
- ✅ Total: 201 testes (108 verdes + 93 vermelhos por `NotImplementedException`).

**Etapa 2 — Implementação do Core ✅** *(esta entrega)*

- ✅ `Statistics` — média/desvio populacional (÷N) por Welford, min/max, `ToSummary`.
- ✅ `ThreadSerialExecutor` — thread dedicada + fila (`BlockingCollection`); mantém a UI livre.
- ✅ `InMemoryReportRepository` — referência de semântica da persistência.
- ✅ `RecordingSession` — decimação 12 Hz, lotes de 2 s, pause/resume sem contar o tempo pausado, save/discard.
- ✅ `RecordingWriter` — traduz eventos da sessão em chamadas ao repositório, roteadas pelo executor.
- ✅ `RecorderViewModel` — máquina de estados, cronômetro com *throttle* de 100 ms, série capada, confirmação.
- ✅ **201 testes verdes**; `dotnet build` OK; `dotnet format` limpo em Core/Tests.
- ⚠️ **Ponto em aberto (spec):** o `Statistics` trata `0.0` como "sem leitura" por canal (exigência de `ToSummary_MapsAllFields`), então uma leitura real de exatamente `0°` não entra na média/desvio/min/max. Revisar se 0 deve ser dado válido — exige ajustar aquele teste.

**Etapa 3 — Visual + integração no `App` ✅**

- ✅ `ITicker`/`IClock` de produção (relógio real e ticker periódico).
- ✅ `RecorderViewModel` singleton no DI (`MauiProgram`), do `InclinationViewModel.OnSample` até `CaptureAngle`.
- ✅ `RecordButton`, `RecordingBar`, `Timer`, `ChartView` (LiveCharts2) e os *popups* de cancelar/salvar.
- ✅ Design system do Stitch em `Resources/Themes/Theme.xaml` + `Colors.xaml`, com fontes reais e navegação inferior.
- ✅ Home de gravação e Relatórios lendo o repositório (lista, detalhe, gráfico, dados brutos e exclusão).
- ✅ Calibragem do acelerômetro; Testes e Ajustes permanecem visuais até a especificação funcional.

**Etapa SQLite — Persistência real ⬜**

- ⬜ `Schema.cs` (DDL `recordings` + `samples`, PK `(recording_id, elapsed_ms)`).
- ⬜ `SqliteReportRepository` (prepared statements, transação por lote).
- ⬜ `RecordingStore` (abre o banco e aplica o schema).
- ⬜ Testes deste repositório reaproveitando o mesmo `ReportRepositoryContractTests` (headless, `Data Source=:memory:`).

## 2. Stack e ferramentas

| Item | Tecnologia |
|---|---|
| Linguagem | C# (`nullable` + `ImplicitUsings`), .NET 10 |
| UI | .NET MAUI 10 + XAML + UraniumUI (Material) |
| Arquitetura de apresentação | MVVM com CommunityToolkit.Mvvm |
| Runtime / build | .NET SDK 10 (`dotnet build`) |
| Sensores | `Microsoft.Maui.Devices.Sensors` — `Accelerometer` |
| Desenho do inclinômetro | `GraphicsView` + `IDrawable` (Microsoft.Maui.Graphics) / SkiaSharp (anel, escala e régua) |
| Gráficos de série | LiveCharts2 |
| Persistência | Microsoft.Data.Sqlite |
| Testes | xUnit + FluentAssertions + NSubstitute |
| Gerenciador | NuGet / CLI `dotnet` |

> A solução .NET fica em `src/`. Todos os comandos `dotnet` deste documento rodam a partir de `src/`.

> **Estado dos pacotes (13/10/2026):** já referenciados no build — `CommunityToolkit.Mvvm` e
> `Microsoft.Data.Sqlite` (Core); `Microsoft.Maui.Controls` (10.0.71), `Microsoft.Extensions.Logging.Debug`,
> `UraniumUI.Material` e `UraniumUI.Icons.MaterialSymbols` (App). **Planejados** — LiveCharts2 e
> SkiaSharp.Views.Maui (Épico 3).

## 3. Estrutura de pastas

Estrutura dentro de `src/`:

Legenda: **[ok]** implementado · **[plan]** planejado (não implementado).

Convenção: cada módulo com lógica tem uma subpasta **`Contracts/`** só com abstrações
(interfaces, records, enums, eventos); o namespace é o do módulo (ex.: `InclinationTest.Core.Recording`).
Módulos que já são 100% contrato não ganham a subpasta (`Platform/`, `Models/`).

```
InclinationTest.sln
  InclinationTest.Core/              # biblioteca net10.0 — lógica pura, sem dependência de UI
    Sensors/
      SensorService.cs         [ok]  # normaliza a leitura do acelerômetro
      Contracts/
        ISensorService.cs      [ok]  # contrato de captura
        IAccelerometerSource.cs [ok] # abstração da fonte nativa (fake nos testes)
        AccelerometerReading.cs [ok] # forma crua entregue pela fonte
    Processing/
      FilterService.cs         [ok]  # filtragem de ruído (EMA)
      AngleConverter.cs        [ok]  # converte a amostra filtrada em ângulos
      Contracts/
        IFilter.cs             [ok]  # contrato de filtragem
    ViewModels/
      InclinationViewModel.cs  [ok]  # ViewModel: intermediário entre o Core e a UI
      RecorderViewModel.cs     [ok]  # ViewModel do gravador
      Contracts/
        RecorderMode.cs        [ok]  # Idle / Recording / Paused
        ConfirmationRequest.cs [ok]  # None / Cancel / Save
    Recording/
      RecordingSession.cs      [ok]  # o gravador sem UI: decimação, lotes, pause/save
      Statistics.cs            [ok]  # média e desvio de Welford, sem lista de amostras
      ThreadSerialExecutor.cs  [ok]  # thread dedicada + fila (mantém a UI livre)
      RecordingWriter.cs       [ok]  # traduz eventos da sessão em chamadas ao repositório
      Contracts/
        IRecordingSession.cs   [ok]  # contrato do gravador (fake nos testes)
        ISerialExecutor.cs     [ok]  # contrato do executor serial
        RecordedSample.cs      [ok]  # amostra gravada (elapsed, roll, trim)
        RecordingSummary.cs    [ok]  # resumo (mean/std/min/max, abertura, duração)
        RecordingOptions.cs    [ok]  # intervalos de amostragem e de lote
        RecordingEvents.cs     [ok]  # SessionState, FinishReason, eventos
    Platform/
      IClock.cs                [ok]  # relógio injetável (produção no App, fake nos testes)
      ITicker.cs               [ok]  # ticker periódico (cronômetro)
    Persistence/
      InMemoryReportRepository.cs [ok] # fake dos testes / referência de semântica
      Contracts/
        IReportRepository.cs   [ok]  # contrato de persistência
        RecordingHeader.cs     [ok]  # cabeçalho da gravação (status, resumo, local)
        RecordingStatus.cs     [ok]  # Recording / Saved
      (Schema, SqliteReportRepository, RecordingStore) [plan] # Etapa própria
    Models/
      Vector3.cs               [ok]  # tipos compartilhados entre o pipeline (contratos)
      MotionSample.cs          [ok]
      Angles.cs                [ok]
      Calibration.cs           [ok]
  InclinationTest.App/               # app MAUI (net10.0-android)
    App.xaml                   [ok]
    App.xaml.cs                [ok]
    AppShell.xaml(.cs)         [ok]  # Shell: host único, sem flyout/navbar nativa
    Converters/
      SelectionColorConverter.cs [ok] # cor do item ativo da NavBar
    Views/
      MainPage.xaml(.cs)       [ok]  # host com material:TabView (NavBar inferior, 5 abas)
      HomeView.xaml(.cs)       [ok]  # conteúdo real da Home (3 campos + Iniciar/Parar/Calibrar)
      CalibragemView.xaml(.cs) [ok]  # acelerômetro real; demais sensores indisponíveis
      RelatoriosView.xaml(.cs) [ok]  # lista, busca/filtro, detalhe, dados brutos, exclusão
      TestesView.xaml(.cs)     [ok]  # visual, aguardando especificação
      ConfiguracoesView.xaml(.cs) [ok] # visual, aguardando especificação
      (RelatorioPage, ...)     [plan] # telas de detalhe empilhadas
    Components/
      Layout/                  [ok]  # ScreenHeader
      Ui/                      [plan] # Card, Modal, Input, ListRow, ...
      Features/                [ok]  # ChartView, ReportChartView, RecordButton, RecordingBar
    Resources/
      Styles/Colors.xaml       [ok]  # aliases Material/UraniumUI
      Themes/Theme.xaml        [ok]  # tokens, tipografia e estilos do Stitch
      Styles/Styles.xaml       [ok]
    Sensors/
      MauiAccelerometerSource.cs [ok] # adapter do Microsoft.Maui.Devices.Sensors
    MauiProgram.cs             [ok]  # DI + UraniumUI + fontes Material Symbols
    Platforms/Android/         [ok]  # manifesto e permissões
  InclinationTest.Core.Tests/        # xUnit (net10.0)
    Sensors/                   [ok]  # SensorServiceTests
    Processing/                [ok]  # FilterServiceTests, AngleConverterTests
    ViewModels/                [ok]  # InclinationViewModelTests + RecorderViewModelTests
    Recording/                 [ok]  # StatisticsTests, RecordingSessionTests, RecordingWriterTests, ThreadSerialExecutorTests
    Persistence/               [ok]  # ReportRepositoryContractTests + InMemoryReportRepositoryTests
    Components/                [plan] # InclinometerViewTests
    TestUtils/                 [ok]  # fixtures e utilitários dos testes (NÃO é uma suite)
```

- `InclinationTest.App/` — camada de apresentação (páginas e componentes). Consome o Core apenas pelo `InclinationViewModel`.
- `InclinationTest.App/Components/Ui/` [plan] — componentes genéricos, sem vocabulário de domínio. Não dependem de `Features/`.
- `InclinationTest.Core/` — lógica pura (captura, filtragem, cálculo de ângulo, ViewModel). Sem dependência de UI, testável na CLI (`dotnet test`) sem emulador nem dispositivo.
- `Resources/Themes/Theme.xaml` — tokens, tipografia e estilos do design system do Stitch; `Resources/Styles/Colors.xaml` mantém os aliases exigidos pelo Material/UraniumUI.
- `InclinationTest.Core.Tests/` — testes xUnit que exercitam o Core.
- `TestUtils/` — fixtures compartilhadas entre as suites, mantidas fora dos diretórios de teste para não serem coletadas como suites (o runner xUnit descobre qualquer classe `*Tests`; utilitários ficam sem esse sufixo).

## 4. Dependências (NuGet)

### Dependências de runtime e de teste

| Pacote | Papel | Estado |
|---|---|---|
| `Microsoft.Maui.Controls` + workload `maui` | app (o `Microsoft.Maui.Essentials` vem no workload) | ok |
| `Microsoft.Maui.Devices.Sensors` (Essentials) | leitura do `Accelerometer` em `MauiAccelerometerSource` | ok |
| `CommunityToolkit.Mvvm` | `ObservableObject`, `[ObservableProperty]`, `[RelayCommand]` | ok |
| `Microsoft.Data.Sqlite` | persistência local dos relatórios e da série temporal (`Core/Persistence/`) | referenciado, uso planejado |
| `UraniumUI` + `UraniumUI.Material` | componentes e theming da UI (`TabView` usado como NavBar) | referenciado |
| `UraniumUI.Icons.MaterialSymbols` | fonte de ícones (glyphs) da NavBar via `FontImageSource` | referenciado |
| `LiveChartsCore.SkiaSharpView.Maui` | gráficos de série temporal (`ChartView` e `ReportChartView`) | em uso |
| `SkiaSharp.Views.Maui.Controls` | desenho do inclinômetro e do gauge em `Controls/` | em uso |
| `xunit`, `xunit.runner.visualstudio`, `Microsoft.NET.Test.Sdk` | execução dos testes | ok |
| `FluentAssertions`, `NSubstitute` | asserções legíveis e mocks nos testes | ok |
| `coverlet.collector` | cobertura (`dotnet test --collect:"XPlat Code Coverage"`) | ok |

> Pré-requisito de ambiente: `dotnet workload install maui`. O app compila para `net10.0-android`.

## 5. Ambiente de testes

**Por que existe o `Core` separado da interface?** Um app MAUI só roda com emulador/dispositivo — não dá para testar a tela de forma rápida e headless. Por isso a lógica de captura, filtragem e cálculo fica em `InclinationTest.Core` (uma biblioteca `net10.0`, código puro), onde tanto a interface quanto o projeto de testes a usam. O mesmo código, uma única fonte de verdade, coberta por testes.

### Rodar os testes

A partir de `src/`:

```bash
dotnet test InclinationTest.Core.Tests/InclinationTest.Core.Tests.csproj    # só o núcleo
dotnet test InclinationTest.Core.Tests/InclinationTest.Core.Tests.csproj --collect:"XPlat Code Coverage"    # cobertura
dotnet build                                  # compila app + core (exige o workload maui-android)
dotnet format --verify-no-changes             # verificação de estilo
```

> Só o núcleo (`InclinationTest.Core` + testes) roda headless, sem workload nem Android SDK. O build do `InclinationTest.App` exige o workload `maui-android` (e o Android SDK).

Os testes ficam em `src/InclinationTest.Core.Tests/`:

```
InclinationTest.Core.Tests/
  Sensors/SensorServiceTests.cs            # 19 testes — assinatura, taxa, conversão de forma
  Processing/FilterServiceTests.cs         # 13 testes — contrato de forma + invariantes
  Processing/AngleConverterTests.cs        # 37 testes — round-trip, golden vectors, fuzz
  ViewModels/InclinationViewModelTests.cs  # 26 testes — orquestração do pipeline
  Recording/StatisticsTests.cs             # 15 testes — Welford (média/desvio pop., min/max)
  Recording/RecordingSessionTests.cs       # 33 testes — decimação, lotes, pause/resume, save/discard
  Recording/RecordingWriterTests.cs        # 7 testes — eventos da sessão → repositório via executor
  Recording/ThreadSerialExecutorTests.cs   # 4 testes — thread dedicada + fila
  Persistence/ReportRepositoryContractTests.cs  # 15 testes — contrato do repositório
  Persistence/InMemoryReportRepositoryTests.cs  # roda o contrato contra o InMemory
  ViewModels/RecorderViewModelTests.cs     # 32 testes — máquina de estados, cronômetro, confirmação
  Components/                              # [plan] InclinometerViewTests
```

Total do `Core`: **201 testes**, **todos verdes**. As Etapas 1 e 2 cobrem `Statistics`,
`RecordingSession`, `RecordingWriter`, `ThreadSerialExecutor`, `InMemoryReportRepository` e
`RecorderViewModel`. `Components/` acompanha a Etapa 3.

### 5.1 O que os testes travam — e o que eles deixam passar

O objetivo é um **padrão de qualidade que não trave a evolução**. Isso se consegue escrevendo os
testes na altitude certa. Existem três níveis, e só um deles prende:

| Nível | Afirma sobre | Exemplo | Trava? |
|---|---|---|---|
| **Contrato** | a forma que atravessa a fronteira | saída tem os 4 campos de `MotionSample`; `Timestamp` intacto | Não |
| **Semântica** | o significado físico do número | `Roll > 0` = borda direita para baixo; `Trim` satura em ±90 | **Sim, e deve** |
| **Implementação** | como o cálculo foi feito | "cria o filtro uma só vez"; "chama X 60 vezes" | Não deve |

O terceiro nível é o que vira um freio: passa no código de hoje e quebra numa refatoração que
deixou o app *melhor*. Por isso o `FilterService`, cujo algoritmo esta documentação permite trocar
livremente, **não tem golden value** — só propriedades que qualquer filtro decente precisa ter.

Já o `AngleConverter` é função pura e determinística, então o nível Semântica se aplica com
força: ali uma "melhoria" que muda o ângulo em meio grau é um bug silencioso, do tipo que só
um engenheiro naval reclamando em campo revelaria.

**Consequência prática:** reescrever o filtro (EMA → mediana → Butterworth), trocar
`[ObservableProperty]` por um store, usar ring buffer, bufferizar amostras, trocar o
`SensorService` por outra fonte nativa — tudo isso continua verde. Mudar o contrato ou o
significado do número fica vermelho de propósito.

Quando um teste bloquear uma melhoria legítima, **o certo é mudar o teste** — e isso é um diff
visível em review, não uma falha do processo.

## 6. Arquitetura em pipeline

Cada etapa tem um arquivo, uma responsabilidade e seus próprios testes:

```
Accelerometer (Microsoft.Maui.Devices.Sensors)
  │
  ▼
IAccelerometerSource   adapter nativo               → AccelerometerReading
  │                   (App: MauiAccelerometerSource)
  ▼
SensorService         normaliza                    → MotionSample bruto
  │
  ▼
FilterService         remove o ruído             → MotionSample filtrado
  │
  ▼
AngleConverter        converte para ângulos      → Angles { roll, trim }
  │
  ▼
InclinationViewModel  ViewModel / mediador       → estado exposto para a UI
  │
  ▼
Interface             Views + Components
```

- **IAccelerometerSource** (`Core/Sensors/IAccelerometerSource.cs`) — abstração da fonte nativa: entrega `AccelerometerReading` (aceleração, rotação, atitude, timestamp). O `Core` só conhece a interface; o `App` fornece a implementação `MauiAccelerometerSource` (`App/Sensors/`), que assina o `Accelerometer` do `Microsoft.Maui.Devices.Sensors`. É o que permite ao `Core` ser testado headless com um fake (`FakeAccelerometerSource`) sem tocar no hardware.
- **SensorService** (`Core/Sensors/SensorService.cs`) — consome um `IAccelerometerSource` e entrega uma `MotionSample` normalizada. A taxa é definida por `SensorSpeed` (`Game`, ~50 Hz, ou `Fastest`, ~200 Hz com decimação no pipeline); diferente do Expo, **não há intervalo configurável em ms**. Essa taxa é para a **visualização ao vivo**; a gravação da série temporal (Prova de Mar, [plan]) rebaixaria para **12 Hz** na ponta da gravação. Não conhece filtragem, ângulos nem UI. Implementa `ISensorService` para permitir um fake nos testes.
- **FilterService** (`Core/Processing/FilterService.cs`) — recebe a `MotionSample` bruta e devolve a mesma forma. Não sabe que existe Sensor nem o Angle Converter.
- **AngleConverter** (`Core/Processing/AngleConverter.cs`) — recebe a `MotionSample` filtrada e devolve `Angles { roll, trim }` em graus. Não sabe que existe sensor nem interface.
- **InclinationViewModel** (`Core/ViewModels/InclinationViewModel.cs`) — intermediário entre o `AngleConverter` e a interface (um ViewModel): orquestra `SensorService + FilterService + AngleConverter`, guarda o estado (`Roll`, `Trim`, `IsRunning`, `IsCalibrated`, `Error`) e expõe as ações (`Start`, `Stop`, `Calibrate`). A UI só conversa com ele. Expõe também um evento `OnSample(Angles angles, double tMs)`, disparado com o **mesmo** resultado de `ToAngles` que alimenta o estado — é por essa torneira que o gravador receberia a série, sem sensor próprio e sem segunda assinatura do `Accelerometer`.
- **RecorderViewModel** (`Core/ViewModels/RecorderViewModel.cs`) — **[ok]** ViewModel do gravador, irmão do `InclinationViewModel` e não filho dele: conhece ângulos, não sensor. Encaminha cada amostra aceita para o `RecordingSession` via `CaptureAngle`, publica o cronômetro no máximo a cada 100 ms (`DefaultTickMs`) e expõe `Record`, `Toggle`, `RequestCancel`, `RequestSave`, `Confirm`, `Dismiss` (máquina de estados `RecorderMode`) com série de `RecordedSample` limitada (`DefaultSeriesCapacity = 600`).
- **RecordingSession** (`Core/Recording/RecordingSession.cs`) — **[ok]** o gravador sem UI. Decide o que entra no disco: **decima para 12 Hz** (`DefaultSampleIntervalMs = 83`), acumula as estatísticas de Welford (`Statistics`) e **escreve em lotes de 2 s** (`DefaultFlushIntervalMs`) via evento `BatchReady`, excluindo o tempo em pausa (`Pause`/`Resume`).
- **IReportRepository** (`Core/Persistence/IReportRepository.cs`) — **[ok]** o contrato de persistência, com `InMemoryReportRepository` já implementado (fake dos testes / referência de semântica). `SqliteReportRepository` (`Microsoft.Data.Sqlite`, aberta por `RecordingStore`) fica para uma etapa própria **[plan]**.

**Regra de independência:** cada etapa conhece apenas a forma de entrada/saída da vizinha (definida em `Core/Models/`). Por isso é possível trocar o `SensorService` (ou o algoritmo do `FilterService`) sem alterar o restante — basta manter o contrato e atualizar apenas os testes daquela etapa.

Tipos compartilhados em `Core/Models/`:

```csharp
public readonly record struct Vector3(double X, double Y, double Z);

public readonly record struct MotionSample(
    Vector3 AccelerationIncludingGravity, // G — gravidade + aceleração (permite inclinação estática)
    Vector3 RotationRate,                 // rad/s — matéria-prima para a filtragem
    Quaternion Rotation,                  // quaternion — atitude (substitui os Euler alpha/beta/gamma do Expo)
    double Timestamp);                    // ms

public readonly record struct Angles(
    double Roll,  // −180..180 — adernada COM sinal, em graus (banda)
    double Trim); // −90..90   — inclinação longitudinal COM sinal, em graus

public readonly record struct Calibration(
    double Roll,  // offset do zero COM sinal, em graus
    double Trim);
```

Função principal de cada módulo:

| Módulo | Função principal | Entrada | Saída |
|---|---|---|---|
| `IAccelerometerSource` | `Start(Action<AccelerometerReading> cb)` | `Accelerometer` nativo (via MAUI Essentials) | `IAccelerometerSource { bool IsAvailable; void Start(...); void Stop(); }` |
| `SensorService` | `Start(Action<MotionSample> cb)` | eventos de `IAccelerometerSource` | `ISensorService { bool IsAvailable; void Start(Action<MotionSample> cb); void Stop(); }` |
| `FilterService` | `FilterService.Create()` | `MotionSample` bruto | `IFilter { MotionSample Process(MotionSample s); }` (mesma forma, filtrada) |
| `AngleConverter` | `AngleConverter.ToAngles(MotionSample s, Calibration? calibration)` | `MotionSample` filtrada + offset opcional | `Angles { Roll, Trim }` (em graus, com sinal e faixas) |
| `InclinationViewModel` | `new InclinationViewModel(...)` | — | `{ Roll, Trim, IsRunning, IsCalibrated, Error, Start(), Stop(), Calibrate() }` |

### Conversão de ângulos (AngleConverter)

- **Convenção do sensor:** o `Microsoft.Maui.Devices.Sensors` reporta o acelerômetro em **G** (não m/s²) com os eixos fixos da orientação retrato (X = direita, Y = cima, Z = saindo da tela). Com o celular deitado (tela para cima), a leitura é `(0, 0, +1.0 G)` — o oposto em sinal e unidade da convenção W3C usada pelo `expo-sensors` (`(0, 0, −9.81)`). Por isso o `AngleConverter` consome o vetor da MAUI diretamente, **sem negar Z**, e trata a magnitude em G.
- Orientação de referência: celular em **retrato**, topo = proa. Deitado (tela para cima) → `0/0`; de lado → `roll ±90`; de bruços → `roll 180`; proa inclinada → `trim` (satura em ±90).
- Sinal: `roll > 0` = borda direita para baixo (leitura pelo lado direito da escala do anel), `trim > 0` = proa para cima (régua desliza para baixo). Assim o mostrador gira e desliza nos dois sentidos.

Decisões de projeto fixadas nos contratos:

- **Apenas o acelerômetro** (e não uma fusão tipo `DeviceMotion`) porque o MAUI Essentials não oferece um evento fundido com `accelerationIncludingGravity`/`rotationRate`/Euler, e o cálculo de banda/trim depende só do vetor de gravidade — o acelerômetro basta para a medição. `Gyroscope`/`OrientationSensor` ficam como matéria-prima opcional para a filtragem.
- **Ângulos com sinal** (roll −180..180, trim −90..90): é o que permite ao anel girar para os dois lados e à régua deslizar para cima e para baixo, como pede o protótipo (`PROTOTIPO.md`). O roll é envolvido em (−180, 180) para que a virada pela proa não dê uma volta completa no mostrador.
- **Calibração como parâmetro do `AngleConverter`** (US-01): `ToAngles` aplica o offset do zero, continuando uma função pura.
- **Interfaces + injeção de dependência** (não funções factory soltas): `IAccelerometerSource`, `ISensorService` e `IFilter` são injetados pelos construtores via `MauiProgram` — fáceis de mockar e testar sem tocar no hardware. O mesmo se aplica ao `IReportRepository` **[ok]**.

## 7. Gravação e persistência (Prova de Mar)

> ✅ **Core entregue (TDD).** Esta seção é a especificação da funcionalidade. As Etapas 1 e 2
> (testes + implementação dos corpos em `Core/Recording/`, `Core/Persistence/` e `RecorderViewModel`)
> já estão concluídas e verdes; falta a **Etapa 3** (visual) e a persistência SQLite. A Prova de Mar
> é citada como **fora do escopo do MVP** no `README.md`; a série temporal foi antecipada por decisão
> do time (ver *Status atual*).

A gravação entra pela **mesma** amostra que o mostrador. O `InclinationViewModel` publica
`OnSample(angles, tMs)` logo depois do `ToAngles` que alimentou o estado, e o
`RecorderViewModel` apenas encaminha. Um gravador com sensor próprio registraria uma
série diferente da que o usuário viu — e o gráfico da revisão não bateria com a
gravação.

| Etapa | Onde | O que decide |
|---|---|---|
| decimação | `RecordingSession` | 60 Hz na tela → 12 Hz no disco (`83 ms`) |
| estatísticas | `Statistics` | média e desvio de Welford, calculados no fluxo, sem lista |
| lote | `RecordingSession` | escrever a cada 2 s, não a cada amostra |
| gravação | `SqliteReportRepository` | prepared statement, uma transação por lote |

### Por que a linha nasce como `recording`

`Start()` grava a linha **antes** do primeiro ângulo, com `status = 'recording'`.
`Save()` é o que promove a `saved`. Isso é deliberado:

- uma queda de energia no meio da prova deixa uma gravação **recuperável**, e não
  um órfão. `FindInterrupted()` devolve exatamente essas linhas;
- a listagem de relatórios (`ListReports`) nunca mostra uma gravação em andamento;
  quem navega para a tela de relatórios vê só o que foi salvo.

`finished_at` fica `null` enquanto `recording`. Uma gravação recuperada não tem
"fim" — tem um `duration_ms` acumulado até a última amostra persistida.

### O que uma queda de força custa

No máximo `DefaultFlushIntervalMs` (2 s) de amostras, porque só o buffer em
memória se perde. O buffer volta a ser o que o sensor já entregou, e o `t_ms` de
cada linha é absoluto — a lacuna aparece como linha reta no gráfico, sem deslocar
o eixo x.

O retry de um lote é idempotente: o `PRIMARY KEY (recording_id, elapsed_ms)`
descarta a reescrita, então reprocessar um flush que falhou no meio não duplica
amostras.

### Por que o SQLite não roda na suíte

`Microsoft.Data.Sqlite` é nativo. `ReportRepositoryContractTests` roda contra
`InMemoryReportRepository`, que é a **referência de semântica**: se ele fica
verde e o SQLite divergir, o bug é do SQLite. Por isso o fake copia as linhas na
leitura, como o SQLite materializa objetos novos a cada `SELECT` — devolver a
referência interna faria o teste passar com um bug que só apareceria no aparelho.

## 8. A gravação na interface

> **Implementado.** O `App` tem `AppShell` e `MainPage` (NavBar inferior via `material:TabView`,
> 5 abas). A `HomeView` concentra a gravação real: inclinômetro Skia (`InclinometerControl`),
> TRIM/ROLL, timer, `ChartView`, `RecordButton`, `RecordingBar` e os modais de salvar/descartar.
> As demais abas usam o mesmo design system; Calibragem controla o acelerômetro, Relatórios lê o
> repositório e Testes/Ajustes permanecem visuais.

O núcleo grava (seção 7) e a interface apenas encaminha as amostras e comandos.

```
AppShell
└── DI singleton: RecorderViewModel     ← a ÚNICA instância do RecorderViewModel
     └── MainPage / TabView
          ├── HomeView
          │    ├── ScreenHeader IsVisible={!immersive}
          │    ├── Timer            (só quando imersivo)
          │    ├── InclinometerControl OnSample={captureAngle}
          │    │    └── InclinationViewModel.OnSample   ← 1ª e única assinatura
          │    ├── ChartView (LiveCharts2)  (só quando imersivo)
          │    ├── RecordButton      (só quando idle)
          │    ├── RecordingBar      (só quando imersivo)
          │    └── Popups ×2         (cancelar / salvar)
          ├── CalibragemView
          ├── RelatoriosView
          ├── TestesView
          └── ConfiguracoesView
```

### Por que o `RecorderViewModel` precisa ser singleton

A `HomeView` desenha a barra e o botão que inicia a gravação, mas a `MainPage` também observa o
estado para esconder a `TabView` durante a prova. Todos precisam do mesmo `Mode`; instanciar o
gravador mais de uma vez criaria sessões, lotes e linhas duplicadas. Por isso o
`RecorderViewModel` é registrado como **singleton no DI** (`AddSingleton<RecorderViewModel>()`).

Durante a gravação a `TabView` está oculta, então ninguém navega para fora da Home no meio de uma
prova — o diálogo de confirmação, que fica na Home, sempre tem quem o mostre.

O **pedido** de confirmação (`None | Cancel | Save`) mora no ViewModel pelo mesmo motivo: a barra
e o diálogo estão na Home, mas o estado precisa sobreviver à troca de modo. Guardar o estado aqui
mantém cada componente com uma responsabilidade só.

### A torneira continua sendo o `InclinometerView`

A página **não** consome o `InclinationViewModel` diretamente para o `Start`/`Stop` do sensor. O
`InclinometerView` segue sendo o dono do `Start`/`Stop` do sensor e o único que o chama; a página
só repassa o callback `OnSample` até ele. É o que mantém a série gravada igual à série vista, e é
o que o teste de componente trava verificando **uma única** assinatura.

`captureAngle` é um método estável (guardado numa referência que não muda a cada render). Se a
referência mudasse, o efeito que a instala no `InclinationViewModel` re-dispararia na taxa da
visualização.

### O sumiço suave

A `TabBar` e o header somem por `IsVisible`, e a `RecordingBar` fica **sempre montada** cuidando
do próprio unmount atrasado — só sai de cena quando a animação de saída termina. Sem isso os dois
módulos trocariam de lugar no mesmo quadro e o usuário veria um corte. É a mesma técnica do
`Popup` de confirmação.

### Por que os gráficos usam a LiveCharts2

Diferente do caso original do React Native (onde não havia biblioteca de gráficos leve e o
`LineChart` foi desenhado à mão em SVG), no .NET MAUI a **LiveCharts2** é open-source (MIT) e
feita para tempo real/streaming sobre SkiaSharp — atende o gráfico de duas poligonais (roll/trim)
sem trazer dependências nativas pesadas.

Já o **inclinômetro** (anel + régua) e o **gauge** continuam desenhados por nós em Skia
(`SKCanvasView`/`InclinometerControl`): controle total do visual "Escuro Instrument" e sem custo de
licença. A matemática da poligonal de referência vem do protótipo
(`proto/src/components/LineChart.jsx`), que fazia isso em ~50 linhas.

**A escala tem piso de 5°.** O protótipo usa `max|v| × 1,15`, que num barco parado amplia o ruído
do sensor até virar uma serra sugerindo adernamento onde não houve.

## 9. Desempenho — o que foi medido e o que mudou

### Como medir

Tudo por ADB sem fio (`adb connect <ip>:5555`), com o app em foco:

```bash
adb shell dumpsys gfxinfo com.inclinationtest.app reset   # zera os contadores
# ...usa o app por alguns minutos...
adb shell dumpsys gfxinfo com.inclinationtest.app         # lê p50/p90/p99 e % janky
adb shell cat /proc/$(adb shell pidof com.inclinationtest.app)/status | grep VmRSS
```

Cuidado: com a tela bloqueada o HyperOS congela o app (`CACHED`, `signal 9`) e a amostra morre.

### O problema

O caminho sensor → tela rodava inteiro a **50 Hz** (`SensorSpeed.Game` → `MainThread.BeginInvokeOnMainThread`)
e, a cada amostra aceita pela gravação (12 Hz), o `ChartView` **reconstruía a série inteira**:

```
Rebuild(): _trim.Clear(); _roll.Clear();
           foreach (600 amostras) { _trim.Add(...); _roll.Add(...); }
```

= 2.400 eventos de coleção e 1.200 alocações por chamada → **~14.400 eventos/s** e ~14.400
`ObservablePoint`/s, além de 50 repaints do inclinômetro e 50 passes de layout dos rótulos por
segundo.

Medido no Redmi Note 13 com APK de **Debug**: `p50 26 ms` (orçamento 16,7 ms), `p90 65 ms`,
`p99 200 ms`, **58% de frames perdidos**, ~8,5 fps.

### O que mudou

| Antes | Depois |
|---|---|
| UI publicada a 50 Hz | UI publicada a 15 Hz (`MauiProgram.UiPublishIntervalMs = 66`) |
| `Clear()` + 600 `Add()` por amostra (2 séries) | `Add()` + 1 `RemoveAt(0)` só nos pontos novos |
| Escala Y recalculada e reatribuída sempre | Só reatribui quando o valor muda |
| Rótulos/agulha a 50 Hz | Rótulos/agulha a 15 Hz |

A gravação **não** perde resolução: `InclinationViewModel.HandleSample` continua disparando
`OnSample` a cada amostra (o `RecordingSession` já decima para 12 Hz); só a *apresentação* é
limitada. O parâmetro é opcional (`uiIntervalMs: 0` = comportamento antigo), o que mantém os testes
existentes intactos.

### Limite conhecido

A série do gráfico é capada em `RecorderViewModel.DefaultSeriesCapacity` = **600 amostras**
≈ **50 s** a 12 Hz: é um gráfico de janela deslizante, não o histórico completo. Para mostrar a
gravação inteira seria preciso decimar (ex.: 1 ponto a cada 500 ms).

Medição depois (app visível, mesmo aparelho): ~**22 fps** contra ~8,5 fps antes. Ainda há jank
porque o APK é **Debug** (JIT sem otimização, sem AOT/trimming) — um perfil Release muda bastante
esse número.

## 10. Relatórios — da gravação à tela

Até a Etapa 3, o "Salvar" gravava a série num `Dictionary` em memória que ninguém lia: a aba
Relatórios era um placeholder e o relatório morria junto com o processo (o HyperOS mata o app com
frequência). Esta seção descreve o caminho que passou a existir.

### O caminho completo

```
HomeView "Salvar" → DisplayPromptAsync(título) → RecorderViewModel.RequestSave() + Confirm()
   └─ RecordingSession.Save(title)
        ├─ RecordingSummary (média, desvio, mín, máx de roll/trim)
        ├─ Flush() do último lote
        └─ Finished(Saved)
             └─ RecordingWriter (thread do ThreadSerialExecutor)
                  ├─ IReportRepository.AppendSamples(...)   → {id}.csv (append)
                  ├─ IReportRepository.SaveRecording(...)   → {id}.hdr (reescrito)
                  └─ Saved?.Invoke(id)                      → RelatoriosView.Refresh()
```

A ordem importa: `RecordingSession.Save` faz `Flush()` **antes** de disparar `Finished`, e todas as
operações passam pelo mesmo `ThreadSerialExecutor`, então o último lote é gravado antes do
cabeçalho ser marcado como salvo.

### Formato em disco

Um diretório (`FileSystem.AppDataDirectory/reports`), dois arquivos por gravação:

| Arquivo | Conteúdo | Escrita |
|---|---|---|
| `{id}.hdr` | cabeçalho em `chave=valor` (título, status, resumo, timestamps) | uma vez ao criar, reescrito ao salvar |
| `{id}.csv` | amostras `elapsedMs;roll;trim` | **só append**, a cada lote de 2 s |

O append é o ponto central: reescrever o arquivo inteiro a cada lote seria o mesmo O(n²) que
travava o gráfico. Como cada lote só acrescenta, o custo por lote é constante, e uma gravação
interrompida por queda de energia continua legível (`FindInterrupted` lê o `status=recording`).

O cabeçalho é texto puro de propósito. JSON exigiria reflexão (ou source generation) para
serializar; texto `chave=valor` não depende de nada e sobrevive a trimming/AOT, o que importa para
um futuro APK Release. Strings (título, local) passam por `Uri.EscapeDataString`, então `=`, `%` e
quebras de linha não quebram o parser. Números usam `CultureInfo.InvariantCulture` com formatos
`"R"`/`"O"` — o arquivo não depende do idioma do aparelho.

Cabeçalho corrompido (queda no meio da escrita) é ignorado na leitura: um arquivo ruim não derruba
a lista inteira.

### Relógio monotônico × relógio de parede

`RecordingHeader.StartedAtMs` vem de `Environment.TickCount64` — milissegundos desde o boot.
É ótimo para medir duração (não salta com mudança de fuso/horário), mas **não é data**. Por isso o
header ganhou `StartedAtUtc` e `SavedAtUtc` (`DateTimeOffset`), preenchidos pelo repositório na
criação e no salvamento. A lista usa `SavedAtUtc` e converte para o fuso local só na formatação.

### O bug que escondia tudo

`RecordingWriter.OnFinished` fazia `_finished = true` **e** `Unsubscribe()`. Como o writer é
singleton, a partir da segunda gravação os handlers já não existiam: `OnBatchReady` e `OnFinished`
caíam no `if (_finished) return;` e nada era salvo. Um app que só persiste o primeiro relatório é
pior do que um sem relatórios, porque parece funcionar.

Correção: `OnStarted` volta `_finished` para `false` e a inscrição só é removida em `Dispose`.
O `Saved` foi adicionado no mesmo lugar para a tela saber que pode recarregar sem polling.

### A tela

`ReportsViewModel` (Core, testável) lista via `IReportRepository.ListReports()`, formata duração,
data e resumo, carrega as amostras ao abrir, aplica busca/filtro por localização, ordena por data
e exclui a gravação selecionada. `RelatoriosView` mostra cards (título, localização e data); ao
tocar, troca para o detalhe com metadados, gauge de faixa de Roll, estatísticas de ROLL/TRIM,
gráfico, dados brutos e menu de opções.

O gráfico do relatório é diferente do gráfico da Home: a Home é *streaming* (janela deslizante de
600 amostras), o relatório é o histórico **inteiro** montado uma única vez. Para não travar com
gravações longas, `ReportChartView` decima para no máximo ~900 pontos (mantendo o último) e ajusta
a escala Y ao maior valor absoluto da série.

A exportação de PDF aparece no menu, mas ainda **não existe**: o app informa que o recurso está
indisponível em vez de simular sucesso. Os dados brutos exibem apenas Trim e Roll, que são os eixos
persistidos; não há Yaw/Z no arquivo.

### Onde os arquivos ficam (e como inspecionar)

Em produção, `FileSystem.AppDataDirectory` no Android é `/data/user/0/com.inclinationtest.app/files`.
Como o APK é Debug, dá para ler sem root:

```bash
adb shell run-as com.inclinationtest.app ls files/reports
adb shell run-as com.inclinationtest.app cat files/reports/<id>.hdr
```

Apagar tudo (para uma demonstração limpa):

```bash
adb shell run-as com.inclinationtest.app rm -rf files/reports
```

### Limite conhecido: estatísticas e o zero

`Statistics.Add` ignora, **por eixo**, valores exatamente `0.0` (`if (roll != 0)`). Isso está travado
por teste (`ToSummary_MapsAllFields` usa `0` como "eixo não medido"), então foi preservado. Na
prática o efeito é pequeno: um acelerômetro real raramente entrega `0,0` exato, e o ruído faz o
valor oscilar em torno de zero. Se o aparelho ficar perfeitamente nivelado (roll exato 0), esses
pontos saem da média e do desvio do eixo. Mudar a semântica exige atualizar aquele teste — é uma
decisão de produto, não um ajuste silencioso.
