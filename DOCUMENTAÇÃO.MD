# Documentação Técnica — Inclination Test

Documentação técnica/de desenvolvimento do projeto. Para visão de produto, backlog, sprints e marcos, veja [`README.md`](README.md).

## 1. Visão geral

O **Inclination Test** é um aplicativo móvel (.NET MAUI) para automatizar a Prova de Inclinação e a Prova de Mar de embarcações, usando os sensores do celular (lidos via `Microsoft.Maui.Devices.Sensors`, sensor `Accelerometer`) para medir o ângulo de inclinação.

Plataforma-alvo: **Android** (.NET 10 / .NET MAUI 10).

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

## 3. Estrutura de pastas

Estrutura dentro de `src/`:

```
InclinationTest.sln
  InclinationTest.Core/              # biblioteca net10.0 — lógica pura, sem dependência de UI
    Sensors/
      ISensorService.cs              # contrato de captura
      SensorService.cs               # captura o Accelerometer
    Processing/
      FilterService.cs               # filtragem de ruído
      AngleConverter.cs              # converte a amostra filtrada em ângulos
    ViewModels/
      InclinationViewModel.cs        # ViewModel: intermediário entre o Core e a UI
      RecorderViewModel.cs           # ViewModel do gravador
    Recording/
      RecordingSession.cs            # o gravador sem UI: decimação, lotes, pause/save
      Statistics.cs                  # média e desvio de Welford, sem lista de amostras
    Persistence/
      Schema.cs                      # DDL de recordings + samples
      IReportRepository.cs           # contrato de persistência
      InMemoryReportRepository.cs    # fake dos testes / referência de semântica
      SqliteReportRepository.cs      # implementação (Microsoft.Data.Sqlite)
      RecordingStore.cs              # abre o banco e aplica o schema
    Models/
      Vector3.cs                     # tipos compartilhados entre o pipeline (contratos)
      MotionSample.cs
      Angles.cs
      Calibration.cs
  InclinationTest.App/               # app MAUI (net10.0-android)
    App.xaml
    AppShell.xaml                    # shell: navegação por abas
    Views/                           # ContentPages (HomePage, CalibrationPage, ...)
    Components/
      Layout/                        # ScreenHeader, Card, ScreenContainer
      Ui/                            # Button, Chip, Modal, Input, ListRow, ...
      Features/                      # InclinometerView, ChartView, GaugeView, RecordButton, ...
    Resources/
      Styles/Colors.xaml             # tokens do design system
      Styles/Styles.xaml
    MauiProgram.cs                   # registro de DI (services, ViewModels, Views)
    Platforms/Android/               # manifesto e permissões
  InclinationTest.Core.Tests/        # xUnit (net10.0)
    Sensors/                         # SensorServiceTests
    Processing/                      # FilterServiceTests, AngleConverterTests
    ViewModels/                      # InclinationViewModelTests, RecorderViewModelTests
    Recording/                       # StatisticsTests, RecordingSessionTests
    Persistence/                     # ReportRepositoryTests
    Components/                      # InclinometerViewTests (a escrever)
    TestUtils/                       # fixtures e utilitários dos testes (NÃO é uma suite)
```

- `InclinationTest.App/` — camada de apresentação (páginas e componentes). Consome o Core apenas pelo `InclinationViewModel`.
- `InclinationTest.App/Components/Ui/` — componentes genéricos, sem vocabulário de domínio. Não dependem de `Features/`.
- `InclinationTest.Core/` — lógica pura (captura, filtragem, cálculo de ângulo, ViewModel). Sem dependência de UI, testável na CLI (`dotnet test`) sem emulador nem dispositivo.
- `Resources/Styles/Colors.xaml` — tokens do design system. Nenhum componente usa cor ou espaçamento literais.
- `InclinationTest.Core.Tests/` — testes xUnit que exercitam o Core.
- `TestUtils/` — fixtures compartilhadas entre as suites, mantidas fora dos diretórios de teste para não serem coletadas como suites (o runner xUnit descobre qualquer classe `*Tests`; utilitários ficam sem esse sufixo).

## 4. Dependências (NuGet)

### Dependências de runtime e de teste

| Pacote | Papel |
|---|---|
| `Microsoft.Maui.Controls` + workload `maui` | app (o `Microsoft.Maui.Essentials` vem no workload) |
| `Microsoft.Maui.Devices.Sensors` (Essentials) | leitura do `Accelerometer` no `SensorService` |
| `CommunityToolkit.Mvvm` | `ObservableObject`, `[ObservableProperty]`, `[RelayCommand]` |
| `UraniumUI` + `UraniumUI.Material` | componentes e theming da UI |
| `LiveChartsCore.SkiaSharpView.Maui` | gráficos de série temporal (`ChartView`) |
| `SkiaSharp.Views.Maui.Controls` | desenho do inclinômetro e do gauge em `Components/Features/` |
| `Microsoft.Data.Sqlite` | persistência local dos relatórios e da série temporal (`Core/Persistence/`) |
| `xunit`, `xunit.runner.visualstudio`, `Microsoft.NET.Test.Sdk` | execução dos testes |
| `FluentAssertions`, `NSubstitute` | asserções legíveis e mocks nos testes |
| `coverlet.collector` | cobertura (`dotnet test --collect:"XPlat Code Coverage"`) |

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
  ViewModels/InclinationViewModelTests.cs  # 24 testes — orquestração do pipeline
  Components/InclinometerViewTests.cs      # (a escrever)
```

Total do `Core`: **93 testes**, todos escritos contra a implementação vazia — ou seja, todos
vermelhos até o código existir. É o estado esperado do TDD, não uma falha.

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
SensorService         captura e normaliza        → MotionSample bruto
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

- **SensorService** (`Core/Sensors/SensorService.cs`) — assina o `Accelerometer` do `Microsoft.Maui.Devices.Sensors` e entrega uma `MotionSample` normalizada. A taxa é definida por `SensorSpeed` (`Game`, ~50 Hz, ou `Fastest`, ~200 Hz com decimação no pipeline); diferente do Expo, **não há intervalo configurável em ms**. Essa taxa é para a **visualização ao vivo**; a gravação da série temporal (Prova de Mar) rebaixa para **12 Hz** na ponta da gravação, sem ressuscitar o sensor. Não conhece filtragem, ângulos nem UI. Implementa `ISensorService` para permitir um fake nos testes.
- **FilterService** (`Core/Processing/FilterService.cs`) — recebe a `MotionSample` bruta e devolve a mesma forma. Não sabe que existe Sensor nem o Angle Converter.
- **AngleConverter** (`Core/Processing/AngleConverter.cs`) — recebe a `MotionSample` filtrada e devolve `Angles { roll, trim }` em graus. Não sabe que existe sensor nem interface.
- **InclinationViewModel** (`Core/ViewModels/InclinationViewModel.cs`) — intermediário entre o `AngleConverter` e a interface (um ViewModel): orquestra `SensorService + FilterService + AngleConverter`, guarda o estado (`Roll`, `Trim`, `IsRunning`, `IsCalibrated`) e expõe as ações (`Start`, `Stop`, `Calibrate`). A UI só conversa com ele. Expõe também um evento `OnSample(Angles angles, double tMs)`, disparado com o **mesmo** resultado de `ToAngles` que alimenta o estado — é por essa torneira que o gravador recebe a série, sem sensor próprio e sem segunda assinatura do `Accelerometer`.
- **RecorderViewModel** (`Core/ViewModels/RecorderViewModel.cs`) — ViewModel do gravador, irmão do `InclinationViewModel` e não filho dele: conhece ângulos, não sensor. Encaminha cada amostra para um `RecordingSession`, publica estado no máximo a cada 100 ms (`DefaultTickMs`) para não arrastar a tela na taxa da visualização, e expõe `Start`, `Pause`, `Resume`, `Toggle`, `Save`, `Discard`.
- **RecordingSession** (`Core/Recording/RecordingSession.cs`) — o gravador sem UI. Decide o que entra no disco: **decima de 60 Hz para 12 Hz** (`DefaultSampleIntervalMs = 83`, a mesma taxa do protótipo), acumula as estatísticas de Welford e **escreve em lotes de 2 s** (`DefaultFlushIntervalMs`). Um flush só grava o que está no buffer, então o custo de uma queda de energia é de no máximo 2 s.
- **IReportRepository** (`Core/Persistence/IReportRepository.cs`) — o contrato de persistência, com duas implementações: `SqliteReportRepository` (`Microsoft.Data.Sqlite`, aberta por `RecordingStore`) e `InMemoryReportRepository`, que é o fake dos testes e a referência de semântica. O `PRIMARY KEY (recording_id, elapsed_ms)` é o que torna o retry de um lote idempotente.

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
| `SensorService` | `Start(Action<MotionSample> cb)` | eventos `Accelerometer` (via MAUI Essentials) | `ISensorService { bool IsAvailable; void Start(Action<MotionSample> cb); void Stop(); }` |
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
- **Interfaces + injeção de dependência** (não funções factory soltas): `ISensorService`, `IFilter` e o repositório são injetados pelos construtores via `MauiProgram` — fáceis de mockar e testar sem tocar no hardware.

## 7. Gravação e persistência (Prova de Mar)

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

`Microsoft.Data.Sqlite` é nativo. `ReportRepositoryTests` roda contra
`InMemoryReportRepository`, que é a **referência de semântica**: se ele fica
verde e o SQLite divergir, o bug é do SQLite. Por isso o fake copia as linhas na
leitura, como o SQLite materializa objetos novos a cada `SELECT` — devolver a
referência interna faria o teste passar com um bug que só apareceria no aparelho.

## 8. A gravação na interface

O núcleo grava desde o incremento anterior; aqui está como ele chega na tela.

```
AppShell
└── DI singleton: RecorderViewModel     ← a ÚNICA instância do RecorderViewModel
     └── Shell / Tabs
          ├── HomePage
          │    ├── ScreenHeader IsVisible={!immersive}
          │    ├── Timer            (só quando imersivo)
          │    ├── InclinometerView OnSample={captureAngle}
          │    │    └── InclinationViewModel.OnSample   ← 1ª e única assinatura
          │    ├── ChartView (LiveCharts2)  (só quando imersivo)
          │    ├── RecordButton      (só quando idle)
          │    └── Popup ×2          (cancelar / salvar)
          ├── TabBar (nav inferior) IsVisible={!immersive}
          └── RecordingBar IsVisible={immersive}
```

### Por que o `RecorderViewModel` precisa ser singleton

A `RecordingBar` mora no `AppShell`, irmã da `TabBar` que ela substitui, mas o botão que
**inicia** a gravação mora na `HomePage`. Os dois precisam do mesmo `Mode`, e instanciar o
gravador nos dois daria duas sessões, dois lotes e duas linhas em `recordings`. Por isso o
`RecorderViewModel` é registrado como **singleton no DI** (`AddSingleton<RecorderViewModel>()`)
e resolvido tanto pela barra quanto pela página.

Durante a gravação a `TabBar` está oculta, então ninguém navega para fora da Home no meio de uma
prova — o diálogo de confirmação, que fica na Home, sempre tem quem o mostre.

O **pedido** de confirmação (`None | Cancel | Save`) mora no ViewModel pelo mesmo motivo: o botão
`X` está na barra e o diálogo está na página. Guardar o estado aqui mantém cada componente com
uma responsabilidade só — o `AppShell` desenha a barra, a `HomePage` desenha o diálogo, nenhum
conhece o detalhe do outro.

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

Já o **inclinômetro** (anel + régua) e o **gauge** continuam desenhados por nós em
`GraphicsView`/`IDrawable`: controle total do visual "Escuro Instrument" e sem custo de licença.
A matemática da poligonal de referência vem do protótipo (`proto/src/components/LineChart.jsx`),
que fazia isso em ~50 linhas.

**A escala tem piso de 5°.** O protótipo usa `max|v| × 1,15`, que num barco parado amplia o ruído
do sensor até virar uma serra sugerindo adernamento onde não houve.
