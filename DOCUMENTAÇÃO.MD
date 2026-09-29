# Documentação Técnica — Inclination Test

Documentação técnica/de desenvolvimento do projeto. Para visão de produto, backlog, sprints e marcos, veja [`README.md`](README.md).

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
| Testes | Jest + `jest-expo` + `@testing-library/react-native` |
| Gerenciador | npm |

> O app Expo fica dentro de `src/`. Todos os comandos npm deste documento rodam a partir de `src/`.

## 3. Estrutura de pastas

```
src/
  index.ts                  # registro do componente raiz (registerRootComponent)
  App.tsx                   # layout base (header, conteúdo, nav bar)
  app/
    screens/                # telas (HomeScreen, ...)
    components/             # componentes (Inclinometer, ...)
  core/
    sensors/
      SensorService.ts      # captura o DeviceMotion e normaliza a amostra
    processing/
      FilterService.ts      # filtragem de ruído (hoje é um passa-redirect)
      AngleConverter.ts     # converte a amostra filtrada em ângulos
    hooks/
      useInclination.ts     # ViewModel: intermediário entre o core e a UI
    types.ts                # tipos compartilhados do pipeline (contratos)
  style/
    app.ts                  # StyleSheet global
  __tests__/                # testes Jest (um arquivo por módulo do core)
  assets/                   # ícones e splash
  app.json                  # configuração do Expo
  jest.config.js            # preset jest-expo
  tsconfig.json             # strict + types: ["jest"]
```

- `app/` — camada de apresentação (telas e componentes). consome o `core/` apenas pelo hook `useInclination`.
- `core/` — lógica pura (captura, filtragem, cálculo de ângulo, ViewModel). Sem dependência de UI, testável na CLI sem emulador nem dispositivo.
- `__tests__/` — testes Jest que exercitam o `core/`.

## 4. Dependências (npm)

### Instalar uma dependência

```bash
cd src
npm install <pacote>
npm install <pacote>@<versao>
```

### Restaurar (instalar as já declaradas)

```bash
cd src
npm install
```

### Listar dependências

```bash
cd src
npm ls                                  # árvore instalada
npm outdated                            # desatualizadas
npm audit                               # vulnerabilidades
```

### Dependências de runtime e de teste

| Pacote | Papel |
|---|---|
| `expo`, `react`, `react-native` | app |
| `expo-sensors` | leitura do `DeviceMotion` no `SensorService` |
| `jest`, `jest-expo`, `@types/jest` | execução dos testes |
| `@testing-library/react-native`, `react-test-renderer` | testes do hook `useInclination` e de componentes |
| `typescript` | `npm run typecheck` |

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
src/__tests__/
  SensorService.test.ts
  FilterService.test.ts
  AngleConverter.test.ts
  useInclination.test.ts
```

## 6. Arquitetura em pipeline

Cada etapa tem um arquivo, uma responsabilidade e seus próprios testes:

```
DeviceMotion (expo-sensors)
  │
  ▼
SensorService      captura e normaliza        → MotionSample bruto
  │
  ▼
FilterService      remove o ruído (hoje passa-redirect) → MotionSample filtrado
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

- **SensorService** (`core/sensors/SensorService.ts`) — consome o `DeviceMotion` do `expo-sensors` e entrega uma `MotionSample` normalizada, a **60 Hz** por padrão (`updateIntervalMs = 1000 / 60`, configurável nas options). Essa taxa é para a **visualização ao vivo**; a **gravação da série temporal** (Prova de Mar) pode usar uma taxa menor — definir na hora de implementar a gravação. Não conhece filtragem, ângulos nem UI.
- **FilterService** (`core/processing/FilterService.ts`) — recebe a `MotionSample` bruta e devolve a mesma forma. Por enquanto é um passa-redirect (sem código de filtragem); o filtro de ruído real entra aqui depois, sem alterar os vizinhos. Não sabe de onde o dado veio nem o que será feito com ele.
- **AngleConverter** (`core/processing/AngleConverter.ts`) — recebe a `MotionSample` filtrada (mais a calibração/zero) e devolve `Angles { roll, trim }` em graus. Não sabe que existe sensor nem interface.
- **useInclination** (`core/hooks/useInclination.ts`) — intermediário entre o `AngleConverter` e a interface (um ViewModel): orquestra `SensorService + FilterService + AngleConverter`, guarda o estado (`roll`, `trim`, `isRunning`, `isCalibrated`) e expõe as ações (`start`, `stop`, `calibrate`). A UI só conversa com ele.

**Regra de independência:** cada etapa conhece apenas a forma de entrada/saída da vizinha (definida em `core/types.ts`). Por isso é possível trocar o `SensorService` (ou o algoritmo do `FilterService`) sem alterar o restante — basta manter o contrato e atualizar apenas os testes daquela etapa.

## 7. Contratos (tipos e funções principais)

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
  roll: number; // 0..180 — magnitude absoluta, em graus (banda)
  trim: number; // 0..90  — magnitude absoluta, em graus (longitudinal)
}

export interface Calibration {
  roll: number; // offset do zero COM sinal, em graus
  trim: number;
}
```

Função principal de cada módulo:

| Módulo | Função principal | Entrada | Saída |
|---|---|---|---|
| `SensorService` | `createSensorService({ updateIntervalMs? })` → `{ start(onSample), stop(), isAvailable() }` | evento `DeviceMotion` (`expo-sensors`) | `MotionSample` bruto (via `normalizeSample`) |
| `FilterService` | `createFilter()` → `{ process(sample) }` | `MotionSample` bruto | mesma `MotionSample` (passa-redirect; filtragem real entra depois) |
| `AngleConverter` | `toAngles(sample, calibration?)` e `toSignedAngles(sample)` | `MotionSample` filtrado + offset de calibração (zero) | `Angles` absolutos (roll 0..180, trim 0..90) |
| `useInclination` | `useInclination({ sensorService?, filter?, updateIntervalMs? })` | — | `{ roll, trim, isRunning, isCalibrated, error, start(), stop(), calibrate() }` |

### Conversão de ângulos (AngleConverter)

- **Convenção do sensor:** o `expo-sensors` segue a convenção W3C — com o celular deitado (tela para cima), `accelerationIncludingGravity ≈ (0, 0, −9.81)` (Android: `acelerômetro − 2 × gravity`; iOS: `gravity` do CoreMotion apontando para baixo). O `AngleConverter` nega o vetor (`up = −a`) antes de calcular.
- `toSignedAngles` — valor cru **com sinal**: `roll = atan2(−up_x, up_z)` (∈ −180..180) e `trim = asin(up_y / ‖up‖)` (∈ −90..90).
- `toAngles` — subtrai o offset de calibração **com sinal** e só então aplica `Math.abs` (mais clamp em 0..180 / 0..90). Subtrair antes do `abs` preserva a direção: calibrar com o convés em 2° e medir 1° resulta em 1°, não 0.
- Orientação de referência: celular em **retrato**, topo = proa. Deitado (tela para cima) → `0/0`; de lado → `roll 90`; de bruços → `roll 180`; proa inclinada → `trim` (satura em 90).

Decisões de projeto fixadas nos contratos:

- **DeviceMotion** (e não só o acelerômetro) porque entrega `rotationRate`/`rotation`, dando mais matéria-prima para a filtragem.
- **Ângulos absolutos** (sem sinal negativo): `roll` 0..180 e `trim` 0..90.
- **Calibração como parâmetro do `AngleConverter`** (US-01): `toAngles` aplica o offset do zero, continuando uma função pura.
- **Funções puras + factory** (não classes): `createFilter()`, `createSensorService()`, `toAngles()` — fáceis de mockar e testar.

> **Status:** os 4 módulos do `core/` estão implementados (`types.ts`, `SensorService`, `FilterService`, `AngleConverter`, `useInclination`) e a UI inicial exibe `roll`/`trim` ao vivo (`HomeScreen` + `Inclinometer`, sem botão de calibração ainda — a tela de calibragem entra na US-01). Frequência: **60 Hz na visualização**; taxa da gravação da série temporal, a definir. Próxima etapa: os testes em `src/__tests__/`.

### Como cada etapa é testada

| Etapa | Estratégia de teste |
|---|---|
| `SensorService` | `jest.mock('expo-sensors')` — simula eventos do `DeviceMotion` |
| `FilterService` | puro, sem mock — hoje o passa-redirect devolve a mesma amostra; quando o filtro entrar: entrada ruidosa → saída mais suave |
| `AngleConverter` | puro, sem mock — vetor conhecido → ângulo conhecido; aplica calibração |
| `useInclination` | `renderHook` (`@testing-library/react-native`) — estado e ações |

## 8. Fluxo para adicionar lógica + teste (TDD)

1. Definir/ajustar o contrato da etapa em `src/core/types.ts` (entrada e saída).
2. Escrever o teste em `src/__tests__/<Modulo>.test.ts` — ele falha (fase vermelha).
3. Implementar a função no módulo do `core/` até o teste passar (fase verde).
4. Rodar `npm test` e `npm run typecheck` para validar.

Exemplo de teste (assinatura do `AngleConverter`):

```ts
import { toAngles } from '../core/processing/AngleConverter';
import type { MotionSample } from '../core/types';

const deitado: MotionSample = {
  accelerationIncludingGravity: { x: 0, y: 0, z: -9.81 },
  rotationRate: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  timestamp: 0,
};

describe('toAngles', () => {
  it('retorna roll 0 e trim 0 com o celular deitado (tela para cima)', () => {
    expect(toAngles(deitado)).toEqual({ roll: 0, trim: 0 });
  });
});
```

> Não há acoplamento manual entre interface e testes: os dois importam o mesmo arquivo do `core/`. Mudou o contrato, os testes acusam antes da interface quebrar em campo.

## 9. Comandos úteis

| Ação | Comando |
|---|---|
| Instalar dependências | `npm install` (em `src/`) |
| Adicionar pacote | `npm install <pacote>` (em `src/`) |
| Rodar testes | `npm test` |
| Testes em watch | `npm run test:watch` |
| Cobertura | `npm run test:coverage` |
| Typecheck | `npm run typecheck` |
| Subir o app | `npm start` (ou `npm run android`) |
| Tunnel (rede local) | `npm run dev` |
