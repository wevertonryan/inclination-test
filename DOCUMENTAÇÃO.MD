# Documentação Técnica — Inclination Test

Documentação técnica/de desenvolvimento do projeto. Para visão de produto, backlog, sprints e marcos, veja [`README.md`](README.md). Para o design system, o layout e a estrutura da camada de apresentação, veja [`DESIGN.md`](DESIGN.md).

## 1. Visão geral

O **Inclination Test** é um aplicativo móvel (React Native + Expo) para automatizar a Prova de Inclinação e a Prova de Mar de embarcações, usando os sensores do celular (lidos via `expo-sensors`, sensor `DeviceMotion`) para medir o ângulo de inclinação.

Plataforma-alvo: **Android** (Expo SDK 57).

## 2. Stack e ferramentas

| Item | Tecnologia |
|---|---|
| Linguagem | TypeScript (modo `strict`) |
| UI | React Native 0.86 + React 19 |
| Runtime / build | Expo SDK 57 (`expo start`) |
| Sensores | `expo-sensors` — `DeviceMotion` |
| Desenho do inclinômetro | `react-native-svg` (anel, escala e régua) |
| Testes | Jest + `jest-expo` + `@testing-library/react-native` |
| Gerenciador | npm |

> O app Expo fica dentro de `src/`. Todos os comandos npm deste documento rodam a partir de `src/`.

## 3. Estrutura de pastas

```
src/
  index.ts                  # registro do componente raiz (registerRootComponent)
  App.tsx                   # shell: container + <Screen/> + <NavBar/> + estado de navegação
  navigation/
    routes.ts               # ScreenId + TABS (id, label, ícone Lucide) — fonte única das rotas
  app/
    screens/                # telas (HomeScreen, CalibrationScreen, ...)
    components/
      layout/               # ScreenHeader, NavBar, Card, ScreenContainer
      ui/                   # Button, IconButton, Chip, Modal, Input, ListRow, ...
      features/             # Inclinometer, LineChart, Gauge, RecordButton, ...
  core/
    sensors/
      SensorService.ts      # captura o DeviceMotion
    processing/
      FilterService.ts      # filtragem de ruído
      AngleConverter.ts     # converte a amostra filtrada em ângulos
    hooks/
      useInclination.ts     # ViewModel: intermediário entre o core e a UI
    recording/
      RecordingSession.ts   # o gravador sem React: decimação, lotes, pause/save
      Statistics.ts         # média e desvio de Welford, sem lista de amostras
      useRecorder.ts        # ViewModel do gravador
    persistence/
      schema.ts             # DDL de recordings + samples
      ReportRepository.ts   # contrato de persistência
      inMemoryReportRepository.ts
      sqliteReportRepository.ts
      RecordingStore.ts     # abre o banco (expo-sqlite) e aplica o schema
    types.ts                # tipos compartilhados entre o pipeline (contratos)
  style/
    theme.ts                # tokens: colors · spacing · radii · typography · elevation · motion
    app.ts                  # StyleSheet do shell
  test-utils/
    motion.ts               # fixtures e utilitários dos testes (NÃO é uma suite)
  __tests__/
    core/                   # testes das etapas do pipeline
      SensorService.test.ts
      FilterService.test.ts
      AngleConverter.test.ts
      useInclination.test.ts
      Statistics.test.ts
      ReportRepository.test.ts
      RecordingSession.test.ts
      useRecorder.test.ts
    components/             # testes da camada de apresentação
      Inclinometer.test.tsx
  assets/                   # ícones e splash
  app.json                  # configuração do Expo
  jest.config.js            # preset jest-expo
  tsconfig.json             # strict + types: ["jest"]
```

> A árvore completa, com a divisão de responsabilidades entre `App.tsx` e as telas, está em [`DESIGN.md` §7](DESIGN.md).

- `app/` — camada de apresentação (telas e componentes). consome o `core/` apenas pelo hook `useInclination`.
- `app/components/ui/` — componentes genéricos, sem vocabulário de domínio. Não importam de `features/`.
- `core/` — lógica pura (captura, filtragem, cálculo de ângulo, ViewModel). Sem dependência de UI, testável na CLI sem emulador nem dispositivo.
- `style/theme.ts` — tokens do design system. Nenhum componente usa cor ou espaçamento literais.
- `__tests__/core/` — testes Jest que exercitam o `core/`.
- `test-utils/` — fixtures compartilhadas entre as suites. **Fora de `__tests__/` de propósito:** o `testMatch` do `jest.config.js` trata qualquer `.ts` dentro de `__tests__/` como suite de testes, e um arquivo de helpers lá seria reportado como "sua suite não contém nenhum teste". Por isso o `jest.config.js` tem `testPathIgnorePatterns` para `test-utils/`, e ele também está fora da cobertura.

## 4. Dependências (npm)

### Dependências de runtime e de teste

| Pacote | Papel |
|---|---|
| `expo`, `react`, `react-native` | app |
| `expo-sensors` | leitura do `DeviceMotion` no `SensorService` |
| `expo-sqlite` | persistência local dos relatórios e da série temporal (`core/persistence/`); exige o plugin `"expo-sqlite"` em `app.json` |
| `react-native-svg` | desenho do inclinômetro, do `LineChart` e do `Gauge` em `app/components/features/` |
| `lucide-react-native` | biblioteca de ícones do app (substitui os SVGs manuais do `proto/` — ver [`DESIGN.md` §5](DESIGN.md)) |
| `jest`, `jest-expo`, `@types/jest` | execução dos testes |
| `@testing-library/react-native`, `react-test-renderer` | testes do hook `useInclination` e de componentes |
| `typescript` | `npm run typecheck` |

> `lucide-react-native` ainda não está no `package.json` — entra na primeira entrega de código do design system. Suas peers (`react ^19`, `react-native-svg ^15`) já são atendidas pela stack atual.

## 5. Ambiente de testes

**Por que existe o `core/` separado da interface?** Um app React Native só roda com emulador/dispositivo — não dá para testar a tela de forma rápida e headless. Por isso a lógica de captura, filtragem e cálculo fica em `core/` (código puro), onde tanto a interface quanto o projeto de testes a usam. O mesmo código, uma única fonte de verdade, coberta por testes.

### Rodar os testes

```bash
cd src
npm test                # roda uma vez (passWithNoTests)
npm run test:watch      # reexecuta a cada alteração
npm run test:coverage   # cobertura (text-summary + lcov)
npm run typecheck       # tsc --noEmit
```

Os testes ficam em `src/__tests__/` (coberto pelo `testMatch` do `jest.config.js`):

```
src/__tests__/core/
  SensorService.test.ts      # 19 testes — assinatura, taxa, conversão de forma
  FilterService.test.ts      # 13 testes — contrato de forma + invariantes
  AngleConverter.test.ts     # 37 testes — round-trip, golden vectors, fuzz
  useInclination.test.ts     # 24 testes — orquestração do pipeline
src/__tests__/components/
  Inclinometer.test.tsx      # (a escrever)
```

Total do `core/`: **93 testes**, todos escritos contra a implementação vazia — ou seja, todos
vermelhos até o código existir. É o estado esperado do TDD, não uma falha.

### 5.1 O que os testes travam — e o que eles deixam passar

O objetivo é um **padrão de qualidade que não trave a evolução**. Isso se consegue escrevendo os
testes na altitude certa. Existem três níveis, e só um deles prende:

| Nível | Afirma sobre | Exemplo | Trava? |
|---|---|---|---|
| **Contrato** | a forma que atravessa a fronteira | saída tem as 4 chaves de `MotionSample`; `timestamp` intacto | Não |
| **Semântica** | o significado físico do número | `roll > 0` = borda direita para baixo; `trim` satura em ±90 | **Sim, e deve** |
| **Implementação** | como o cálculo foi feito | "cria o filtro uma só vez"; "chama X 60 vezes" | Não deve |

O terceiro nível é o que vira um freio: passa no código de hoje e quebra numa refatoração que
deixou o app *melhor*. Por isso o `FilterService`, cujo algoritmo esta documentação permite trocar
livremente, **não tem golden value** — só propriedades que qualquer filtro decente precisa ter.

Já o `AngleConverter` é função pura e determinística, então o nível Semântica se aplica com
força: ali uma "melhoria" que muda o ângulo em meio grau é um bug silencioso, do tipo que só
um engenheiro naval reclamando em campo revelaria.

**Consequência prática:** reescrever o filtro (EMA → mediana → Butterworth), trocar `useState`
por um store, usar ring buffer, bufferizar amostras, trocar o `SensorService` por outra fonte
nativa — tudo isso continua verde. Mudar o contrato ou o significado do número fica vermelho
de propósito.

Quando um teste bloquear uma melhoria legítima, **o certo é mudar o teste** — e isso é um diff
visível em review, não uma falha do processo.

## 6. Arquitetura em pipeline

Cada etapa tem um arquivo, uma responsabilidade e seus próprios testes:

```
DeviceMotion (expo-sensors)
  │
  ▼
SensorService      captura e normaliza        → MotionSample bruto
  │
  ▼
FilterService      remove o ruído             → MotionSample filtrado
  │
  ▼
AngleConverter     converte para ângulos      → Angles { roll, trim }
  │
  ▼
useInclination     ViewModel / mediador       → estado exposto para a UI
  │
  ▼
Interface          app/screens + app/components
```

- **SensorService** (`core/sensors/SensorService.ts`) — consome o `DeviceMotion` do `expo-sensors` e entrega uma `MotionSample` normalizada, a **60 Hz** por padrão (`updateIntervalMs = 1000 / 60`, configurável nas options). Essa taxa é para a **visualização ao vivo**; a gravação da série temporal (Prova de Mar) rebaixa para **12 Hz** na ponta da gravação, sem ressuscitar o sensor. Não conhece filtragem, ângulos nem UI.
- **FilterService** (`core/processing/FilterService.ts`) — recebe a `MotionSample` bruta e devolve a mesma forma. Não sabe que existe Sensor nem o Angle Converter 
- **AngleConverter** (`core/processing/AngleConverter.ts`) — recebe a `MotionSample` filtrada e devolve `Angles { roll, trim }` em graus. Não sabe que existe sensor nem interface.
- **useInclination** (`core/hooks/useInclination.ts`) — intermediário entre o `AngleConverter` e a interface (um ViewModel): orquestra `SensorService + FilterService + AngleConverter`, guarda o estado (`roll`, `trim`, `isRunning`, `isCalibrated`) e expõe as ações (`start`, `stop`, `calibrate`). A UI só conversa com ele. Aceita também `onSample?: (angles: Angles, tMs: number) => void`, chamado com o **mesmo** `toAngles` que alimenta o estado — é por essa torneira que o gravador recebe a série, sem sensor próprio e sem segunda assinatura do `DeviceMotion`.
- **useRecorder** (`core/recording/useRecorder.ts`) — ViewModel do gravador, irmão do `useInclination` e não filho dele: conhece ângulos, não sensor. Encaminha cada amostra para um `RecordingSession`, publica estado no máximo a cada 100 ms (`DEFAULT_TICK_MS`) para não arrastar a tela a 60 Hz, e expõe `start`, `pause`, `resume`, `toggle`, `save`, `discard`.
- **RecordingSession** (`core/recording/RecordingSession.ts`) — o gravador sem React. Decide o que entra no disco: **decima de 60 Hz para 12 Hz** (`DEFAULT_SAMPLE_INTERVAL_MS = 83`, a mesma taxa do protótipo), acumula as estatísticas de Welford e **escreve em lotes de 2 s** (`DEFAULT_FLUSH_INTERVAL_MS`). Um flush só grava o que está no buffer, então o custo de uma queda de energia é de no máximo 2 s.
- **ReportRepository** (`core/persistence/ReportRepository.ts`) — o contrato de persistência, com duas implementações: `sqliteReportRepository` (`expo-sqlite`, aberta por `RecordingStore`) e `inMemoryReportRepository`, que é o fake dos testes e a referência de semântica. O `PRIMARY KEY (recording_id, elapsed_ms)` é o que torna o retry de um lote idempotente.

**Regra de independência:** cada etapa conhece apenas a forma de entrada/saída da vizinha (definida em `core/types.ts`). Por isso é possível trocar o `SensorService` (ou o algoritmo do `FilterService`) sem alterar o restante — basta manter o contrato e atualizar apenas os testes daquela etapa.

Tipos compartilhados em `src/core/types.ts`:

```ts
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface MotionSample {
  accelerationIncludingGravity: Vector3; // m/s² — gravidade + aceleração (permite inclinação estática)
  rotationRate: Vector3;                 // °/s — matéria-prima para a filtragem
  rotation: Vector3;                     // rad — alpha, beta, gamma
  timestamp: number;                     // ms
}

export interface Angles {
  roll: number; // −180..180 — adernada COM sinal, em graus (banda)
  trim: number; // −90..90   — inclinação longitudinal COM sinal, em graus
}

export interface Calibration {
  roll: number; // offset do zero COM sinal, em graus
  trim: number;
}
```

Função principal de cada módulo:

| Módulo | Função principal | Entrada | Saída |
|---|---|---|---|
| `SensorService` | `createSensorService(options?: { updateIntervalMs?: number })` | eventos `DeviceMotion` (via `expo-sensors`) | `SensorService { isAvailable(), start(cb: (s: MotionSample) => void), stop() }` |
| `FilterService` | `createFilter()` | `MotionSample` bruto | `Filter { process(s: MotionSample): MotionSample }` (mesma forma, filtrada) |
| `AngleConverter` | `toAngles(sample: MotionSample, calibration?: Calibration): Angles` | `MotionSample` filtrada + offset opcional | `Angles { roll, trim }` (em graus, com sinal e faixas) |
| `useInclination` | `useInclination()` | — | `{ roll, trim, isRunning, isCalibrated, error, start(), stop(), calibrate() }` |

### Conversão de ângulos (AngleConverter)

- **Convenção do sensor:** o `expo-sensors` segue a convenção W3C — com o celular deitado (tela para cima), `accelerationIncludingGravity ≈ (0, 0, −9.81)` (Android: `acelerômetro − 2 × gravity`; iOS: `gravity` do CoreMotion apontando para baixo). O `AngleConverter` nega o vetor (`up = −a`) antes de calcular.
- Orientação de referência: celular em **retrato**, topo = proa. Deitado (tela para cima) → `0/0`; de lado → `roll ±90`; de bruços → `roll 180`; proa inclinada → `trim` (satura em ±90).
- Sinal: `roll > 0` = borda direita para baixo (leitura pelo lado direito da escala do anel), `trim > 0` = proa para cima (régua desliza para baixo). Assim o mostrador gira e desliza nos dois sentidos.

Decisões de projeto fixadas nos contratos:

- **DeviceMotion** (e não só o acelerômetro) porque entrega `rotationRate`/`rotation`, dando mais matéria-prima para a filtragem.
- **Ângulos com sinal** (roll −180..180, trim −90..90): é o que permite ao anel girar para os dois lados e à régua deslizar para cima e para baixo, como pede o protótipo (`PROTOTIPO.md`). O roll é envolvido em (−180, 180) para que a virada pela proa não dé uma volta completa no mostrador.
- **Calibração como parâmetro do `AngleConverter`** (US-01): `toAngles` aplica o offset do zero, continuando uma função pura.
- **Funções puras + factory** (não classes): `createFilter()`, `createSensorService()`, `toAngles()` — fáceis de mockar e testar.

## 7. Gravação e persistência (Prova de Mar)

A gravação entra pela **mesma** amostra que o mostrador. `useInclination` publica
`onSample(angles, tMs)` logo depois do `toAngles` que alimentou o estado, e o
`useRecorder` apenas encaminha. Um gravador com sensor próprio registraria uma
série diferente da que o usuário viu — e o gráfico da revisão não bateria com a
gravação.

| Etapa | Onde | O que decide |
|---|---|---|
| decimação | `RecordingSession` | 60 Hz na tela → 12 Hz no disco (`83 ms`) |
| estatísticas | `Statistics` | média e desvio de Welford, calculados no fluxo, sem lista |
| lote | `RecordingSession` | escrever a cada 2 s, não a cada amostra |
| gravação | `sqliteReportRepository` | prepared statement, uma transação por lote |

### Por que a linha nasce como `recording`

`start()` grava a linha **antes** do primeiro ângulo, com `status = 'recording'`.
`save()` é o que promove a `saved`. Isso é deliberado:

- uma queda de energia no meio da prova deixa uma gravação **recuperável**, e não
  um órfão. `findInterrupted()` devolve exatamente essas linhas;
- a listagem de relatórios (`listReports`) nunca mostra uma gravação em andamento;
  quem navega para a tela de relatórios vê só o que foi salvo.

`finished_at` fica `null` enquanto `recording`. Uma gravação recuperada não tem
"fim" — tem um `duration_ms` acumulado até a última amostra persistida.

### O que uma queda de força custa

No máximo `DEFAULT_FLUSH_INTERVAL_MS` (2 s) de amostras, porque só o buffer em
memória se perde. O buffer volta a ser o que o sensor já entregou, e o `t_ms` de
cada linha é absoluto — a lacuna aparece como linha reta no gráfico, sem deslocar
o eixo x.

O retry de um lote é idempotente: o `PRIMARY KEY (recording_id, elapsed_ms)`
descarta a reescrita, então reprocessar um flush que falhou no meio não duplica
amostras.

### Por que o SQLite não roda na suíte

`expo-sqlite` é nativo. `ReportRepository.test.ts` roda contra
`inMemoryReportRepository`, que é a **referência de semântica**: se ele fica
verde e o SQLite divergir, o bug é do SQLite. Por isso o fake copia as linhas na
leitura, como o SQLite materializa objetos novos a cada `SELECT` — devolver a
referência interna faria o teste passar com um bug que só apareceria no aparelho.
