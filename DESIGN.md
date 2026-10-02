# Design System e Layout — Inclination Test

Especificação de **design** (identidade visual, tokens e componentes) e de **layout/estrutura** da camada de apresentação do app.

Para o comportamento funcional das telas, ver [`TELAS.md`](TELAS.md). Para o protótipo navegável que definiu o layout, ver [`PROTOTIPO.md`](PROTOTIPO.md). Para arquitetura, stack e contratos do `core/`, ver [`DOCUMENTAÇÃO.MD`](DOCUMENTAÇÃO.MD).

> **Status:** implementado. Os tokens vivem em [`src/tamagui.config.ts`](src/tamagui.config.ts) como tokens do [Tamagui](https://tamagui.dev), com [`src/style/theme.ts`](src/style/theme.ts) como fachada de literais crus para o código que ainda usa `StyleSheet` do React Native. Este documento é o contrato; o código é a implementação.

---

## 1. Direção de design — "Escuro Instrument"

A direção é um **instrumento de medição**, não um app de planilha. Três decisões definem o caráter:

1. **Fundo escuro e profundo.** O mostrador é o elemento mais brilhante da tela. Isso cria uma hierarquia única: primeiro se lê o ângulo, depois o contexto (status do sensor, gráfico, lista). Em uso noturno ou em ambiente de pouca luz, o escuro não cega e conserva a bateria (OLED).
2. **Cor como canal de informação, nunca como decoração.** Cada cor tem um significado fixo e estável em todo o app (§1.2). Um âmbar na tela significa sempre "roll"; um verde sempre "calibrado e OK". Não existem acentos decorativos.
3. **Número antes de texto.** A leitura numérica é o produto. Valores grandes, tabulares e sempre com unidade visível (`3,2°`, `04:35 · 128`).

O que **mudou** em relação ao protótipo: o `proto/` usava o mesmo DNA de cor, mas com tokens implícitos em variáveis CSS e SVGs desenhados à mão. Aqui o que muda é a **formalização** — paleta semântica nomeada, escala tipográfica com papéis, escala de espaçamento, biblioteca de ícones única e especificação de estados por componente.

### 1.1 Cores de superfície

| Token | Hex | Uso |
|---|---|---|
| `bg` | `#0B1220` | Fundo do app (canvas, atrás de tudo) |
| `bgElevated` | `#111A2E` | Header e NavBar — precisam se destacar do conteúdo que rola por baixo |
| `bgCard` | `#16203A` | Cards, modais, chips, barra de gravação |
| `bgInput` | `#0D1526` | Campos de texto (mais fundo que o card, para parecer "cavado") |
| `overlay` | `rgba(4, 8, 16, 0.72)` | Scrim do modal com backdrop |
| `shadow` | `#000000` | Cor das sombras |

Três níveis de elevação de superfície (`bg` → `bgElevated` → `bgCard`) dão profundidade sem borda grossa. A borda é hairline de 1px, sempre em `border`.

### 1.2 Cores de conteúdo e semânticas

| Token | Hex | Uso |
|---|---|---|
| `text` | `#E8EDF6` | Texto principal, valores numéricos grandes |
| `textMuted` | `#8B98B4` | Texto secundário, rótulos de eixo, legendas |
| `textFaint` | `#5E6B87` | Desabilitado, placeholder, texto terciário |
| `accent` | `#F5A623` | Marca e ação primária; **também = Roll** |
| `accentStrong` | `#FFB93F` | Estado pressionado/foco do accent |
| `accentSoft` | `rgba(245,166,35,0.12)` | Fundo de item selecionado, chip ativo |
| `ok` | `#34C98A` | Calibrado, gravação salva |
| `warn` | `#F5A623` | Alerta não bloqueante (alias de `accent`) |
| `danger` | `#FF5C5C` | Não calibrado, erro na calibração, excluir |
| `dangerSoft` | `rgba(255,92,92,0.14)` | Fundo de chip/campo em estado de erro |
| `rec` | `#E13B3B` | Botão de gravar — **vermelho saturado, ≠ `danger`** |

> **Colisão deliberada `warn` ≡ `accent`:** por decisão de produto, "atenção" e "marca" são a mesma família âmbar. `danger` e `rec` são os dois vermelhos independentes — `rec` é mais saturado e escuro porque precisa ser lido como "gravar", não como "erro".

### 1.3 Cores de domínio (fixas)

| Token | Hex | Uso |
|---|---|---|
| `roll` | `#F5A623` | Série Roll no gráfico, eixo do anel, ponteiro |
| `trim` | `#4AA3FF` | Série Trim no gráfico, régua |
| `chartGrid` | `#1C2842` | Grade e linhas de eixo dos gráficos |
| `chartAxis` | `#8B98B4` | Rótulos numéricos dos eixos |

Essas duas cores **não mudam** mesmo se o accent mudar um dia. Roll/Trim é a convenção de leitura de qualquer instrumento de inclinação.

### 1.4 Contraste

| Combinação | Razão (WCAG) | Veredito |
|---|---|---|
| `text` sobre `bg` | ≈ 14:1 | AAA |
| `text` sobre `bgCard` | ≈ 12:1 | AAA |
| `textMuted` sobre `bgCard` | ≈ 5:1 | AA (rótulo de eixo, texto secundário) |
| `accent` sobre `bgCard` | ≈ 7:1 | AAA |
| `ok` / `danger` sobre `bgCard` | ≈ 6:1 | AAA |
| `textFaint` sobre `bgCard` | ≈ 2:4:1 | **Só para desabilitado** — nunca para informação |

`textFaint` **não** pode ser usado para texto que precisa ser lido como informação (rótulo, status, valor). Existe para "botão desabilitado" e placeholder, onde o baixo contraste é intencional.

---

## 2. Tipografia

Sem fonte customizada — `Roboto` do sistema (Android é a plataforma-alvo). O design se apoia em **peso, tamanho e tabularidade**, não em fontes decorativas. Isso mantém o app com zero assets de fonte e evita reflow no mostrador.

### 2.1 Papéis

| Papel | Tamanho | Peso | Uso |
|---|---|---|---|
| `display` | 40 | 800 | Cronômetro da gravação, valor numérico herói (abertura em graus) |
| `title` | 17 | 700 | Título da tela no header |
| `heading` | 16 | 700 | Título de card, título do modal |
| `body` | 14 | 400 | Texto corrido, descrição no modal |
| `label` | 13 | 600 | Item de lista, label de campo, nome do sensor |
| `caption` | 11 | 700 | Rótulo de eixo, legenda, cabeçalho de tabela |
| `micro` | 10 | 500 | Label da NavBar |

`lineHeight` acompanha o tamanho em ~1.4, exceto `display` e `title`, que usam `lineHeight` igual ao tamanho (centralização vertical em bloco curto).

### 2.2 Regra tabular — obrigatória em todo número

Qualquer texto que renderize um número recebe `fontVariant: ['tabular-nums']`. Sem isso, os dígitos mudam de largura e o valor "pula" horizontalmente a cada atualização — inaceitável em um mostrador que atualiza a 60 Hz.

Vale para: cronômetro, ângulos Roll/Trim do anel e da régua, valores de Média/Desvio, rótulos dos eixos, contador de amostras, duração do relatório. Vale inclusive no **`Button`** que mostra tempo.

### 2.3 Formatação numérica

- Locale **pt-BR** em toda a UI: `Intl.NumberFormat('pt-BR')` ou `toLocaleString('pt-BR')`.
- Ângulos: 1 casa decimal, unidade fora do número — `3,2°`. Sinal explícito só quando negativo (`−4,1°`), nunca `+4,1°`.
- Graus inteiros na escala do anel: `30°`, `60°`, `90°`, `180°`.
- Cronômetro: `mm:ss` no relatório; `mm:ss · mmm` (milésimos) na gravação ao vivo, com separador `·` e algarismos zerados à esquerda.

---

## 3. Espaçamento, raios e elevação

### 3.1 Espaçamento — escala base 4

| Token | Valor | Aplicação típica |
|---|---|---|
| `space.1` | 2 | Gap mínimo, deslocamento de ícone dentro de botão |
| `space.2` | 4 | Gap ícone↔texto |
| `space.3` | 8 | Gap interno de chip, gap entre linhas de lista |
| `space.4` | 12 | Padding de tela, gap entre blocos do card |
| `space.14` | 14 | Padding vertical do header, padding horizontal do `Input` — único valor fora da base 4 |
| `space.5` | 16 | Padding de card, padding lateral padrão |
| `space.6` | 20 | Padding de modal |
| `space.7` | 24 | Margem acima de seção |
| `space.8` | 32 | Respiro do topo de tela |

Padding lateral padrão de tela: **16** (`space.5`). Padding de card: **16**. Padding de modal: **20** horizontal.

**Sobre o `space.14`.** A escala é base 4, mas `ScreenHeader` pede `padding 14/16` e `Input` pede `12/14` (§6.1, §6.2). O 14 não cabe na base 4 e ainda assim §6.4 proíbe número literal. As saídas seriam um token ad-hoc ou quebrar a regra — por isso `space.14` é um token deliberado, e não um deslize da régua. Ele fica na escala **na ordem do valor** (`12 → 14 → 16`), e não no fim, para que a régua visual da página de design continue legível.

### 3.2 Raios

| Token | Valor | Uso |
|---|---|---|
| `radius.sm` | 8 | Chip, botão pequeno, input |
| `radius.md` | 12 | Botão, input, mini-card |
| `radius.lg` | 16 | Card, modal, NavBar highlight |
| `radius.pill` | 999 | Chip de status, cronômetro, botão redondo |

### 3.3 Elevação

| Nível | Sombra | Uso |
|---|---|---|
| `elevation.1` | `elevation 2`, `opacity 0.30`, `radius 6`, `offsetY 2` | Card de relatório, linha da lista |
| `elevation.2` | `elevation 6`, `opacity 0.38`, `radius 12`, `offsetY 5` | Botão de gravar flutuante, botões redondos, cronômetro |
| `elevation.3` | `elevation 12`, `opacity 0.45`, `radius 24`, `offsetY 8` | Modal, sheet |

No Android só `elevation` tem efeito; `shadowColor/Opacity/Radius/Offset` são mantidos para paridade caso entre iOS/web. Sempre aplicar o par completo.

---

## 4. Movimento

Duração e curva importadas do protótipo — a animação já estava validada visualmente e é parte do layout aprovado.

| Token | Duração | Curva | Uso |
|---|---|---|---|
| `motion.fast` | 120ms | `ease-out` | Feedback de toque, troca de estado de chip |
| `motion.base` | 180ms | `ease-out` | Abertura de modal, toggle de chip |
| `motion.exit` | 230ms | `ease-in` | Saída de modal, fade-out do card de gravação |
| `motion.slow` | 400ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Header e NavBar escondendo, entrada do card de gravação, sumiço da NavBar |

Regras:

- **Nada some sem animação de saída.** Cancelar/salvar gravação usa `motion.exit` antes de desmontar.
- **Header e NavBar deslizam** (`translateY`), não apenas desaparecem — o deslocamento comunica que a tela ficou imersiva.
- **Spinner de calibração**: rotação contínua, `motion.slow` por volta, sem pausa entre ciclos.
- **Botão redondo**: `scale 0.94` no `pressed`, sem transição de cor (feedback tátil imediato).

---

## 5. Iconografia — Lucide

Todos os ícones do app vêm de **`lucide-react-native`**. O `proto/` usava 21 SVGs desenhados à mão em `proto/src/components/icons.jsx`; eles são substituídos pelo Lucide, o que garante traço, espessura e cantos consistentes em toda a UI.

### 5.1 Configuração

```ts
// Todos os ícones: strokeWidth 2 (padrão Lucide), currentColor via prop `color`
import { House, Crosshair, FileText } from 'lucide-react-native';
```

### 5.2 Tamanhos

| Token | px | Uso |
|---|---|---|
| `icon.sm` | 14 | Ícone dentro de chip de status, dentro de botão pequeno |
| `icon.md` | 16 | Ícone de item de lista, seta do accordion |
| `icon.lg` | 20 | Chip de status do sensor no header |
| `icon.xl` | 24 | Item da NavBar |
| `icon.2xl` | 28 | Ícone dentro de botão redondo (grave/cancelar/salvar/calibrar) |

O Lucide é desenhado em viewBox 24×24 — em React Native passar `size={24}` já resolve a escala, sem `transform: scale`.

### 5.3 Mapeamento dos ícones do protótipo → Lucide

| Antes (`proto/…/icons.jsx`) | Lucide | Onde aparece |
|---|---|---|
| `HomeIcon` | `House` | NavBar |
| `CalibrationIcon` | `Crosshair` | NavBar, botão de calibrar |
| `ReportsIcon` | `FileText` | NavBar |
| `TestsIcon` | `ClipboardCheck` | NavBar |
| `SettingsIcon` | `Settings` | NavBar |
| `CheckIcon` | `Check` | Status calibrado, botão salvar |
| `CrossIcon` | `X` | Status não calibrado, botão cancelar |
| `QuestionIcon` | `CircleHelp` | Status não identificado |
| `ExclamationIcon` | `TriangleAlert` | Erro na calibração |
| `SensorIcon` | `Radio` | Chip do header, linha da tabela de sensores |
| `WrenchIcon` | `Wrench` | Botão de calibrar em 1 clique |
| `SpinnerIcon` | `LoaderCircle` | Estado "calibrando" |
| `SearchIcon` | `Search` | Barra de busca |
| `FunnelIcon` | `Funnel` | Botão de filtro |
| `ChevronLeftIcon` | `ChevronLeft` | Botão voltar do relatório |
| `DotsIcon` | `EllipsisVertical` | Menu do relatório |
| `TrashIcon` | `Trash2` | Excluir relatório |
| `PdfIcon` | `FileDown` | Exportar PDF |
| (novo) | `Play` | Retomar gravação |
| (novo) | `Pause` | Pausar gravação |
| (novo) | `Circle` (preenchido) | Núcleo branco do botão de gravar |
| (novo) | `MapPin` | Localização no card de relatório |
| (novo) | `Clock` | Tempo registrado |
| (novo) | `CircleX` / `BluetoothOff` | Sensor ausente (GPS desligado) |
| (novo) | `CalendarDays` | Filtro por data |
| (novo) | `Download` | Atalho de exportação na listagem |
| (novo) | `Info` | Modal explicativo de status do sensor |
| (novo) | `Gauge` / `Activity` | Teste de integridade |

### 5.4 Regras de uso

- **Ícone nunca é o único sinal.** Sempre acompanhado de texto ou de um rótulo acessível (`accessibilityLabel`).
- **Cor do ícone** por herança: `color={colors.textMuted}` por padrão, `accent` quando ativo, `ok`/`danger` em status.
- Ícones de 28px dentro de botão redondo de 60px: raio de toque de 60px ≥ alvo mínimo de 44px (§8).

---

## 6. Componentes

A biblioteca é dividida em três camadas, dentro de `src/app/components/`:

- **`layout/`** — a casca da tela: header, navbar, container rolável, card de superfície.
- **`ui/`** — genérico, sem vocabulário de domínio. Não sabe o que é sensor nem ângulo.
- **`features/`** — blocos do domínio de inclinometria (inclinômetro, gráfico, botão de gravar).

> Dependência em um sentido só: `layout/` → `ui/`, `features/` → `ui/`. `ui/` não importa de ninguém. `screens/` compõe os três.

### 6.1 `ui/`

| Componente | Variantes / props | Estados | Notas |
|---|---|---|---|
| `Button` | `variant: primary \| ghost \| danger`, `size: sm \| md \| lg`, `icon?`, `loading?` | default, pressed, disabled, loading | `primary` = `accent` com texto `#1A1505`; `ghost` = `bgCard` + borda; `danger` = `danger` com texto branco. Altura `sm 32 · md 44 · lg 52`, `radius.md`, `gap 4` entre ícone e texto |
| `IconButton` | `size: 48 \| 60`, `tone: neutral \| accent \| ok \| danger`, `Icon` | default, pressed, disabled | Redondo (`radius.pill`). `60` é o dos botões flutuantes; `48` para ações de header |
| `Chip` | `active?`, `Icon?`, `size` | default, active, disabled | `radius.pill`, `bgCard` + borda; ativo = `accentSoft` + borda `accent` + texto `accent` |
| `StatusDot` | `status: ok \| uncalibrated \| unknown \| error \| calibrating` | — | Círculo 18px com ícone 14px dentro. `ok` → `ok`/texto `#05150D`; `uncalibrated` e `error` → `danger`/branco; `unknown` → `textMuted`/`#101828`; `calibrating` → `LoaderCircle` girando em `accent` |
| `Modal` | `visible`, `backdrop?: boolean` (default `true`), `onClose?`, `dismissible?` | abrindo, aberto, fechando | Card `bgElevated` + borda, `radius.lg`, largura máx 340, `padding 20`. `backdrop={false}` = card flutuante: **não escurece a tela e o toque fora dele passa direto** para o que estiver embaixo, sem camada de dispensa — fechar é por botão de voltar ou por um controle dentro de `children`. Entrada `motion.base`, saída `motion.exit` |
| `Input` | `placeholder?`, `Icon?` (ícone dentro à esquerda), `value`, `onChangeText`, `error?` | default, focado, com erro | `bgInput`, borda `border`, `radius.md`, `padding 12/14` (`space.4`/`space.14`). Focado → borda `accent`, **desde que não haja erro** — com erro a borda `danger` manda, e o `backgroundColor` vai para `dangerSoft`. Com erro → borda `danger` + mensagem em `danger` |
| `ListRow` | `Icon?`, `title`, `subtitle?`, `right?`, `onPress?` | default, pressed | Linha sem card próprio: `padding 12/16`, `gap 12`, divisor `border` entre linhas. `right` alinhado à direita |
| `Divider` | — | — | 1px `border` |
| `EmptyState` | `Icon?`, `title`, `description?` | — | Centralizado, ícone 40px `textFaint`, título `label`, descrição `body` `textMuted` |
| `Toast` | `message`, `tone: ok \| neutral \| danger` | visível, sumindo | Fila acima da NavBar, `radius.md`, some sozinho após 2s (`motion.exit`) |

### 6.2 `layout/`

| Componente | Contrato | Notas |
|---|---|---|
| `ScreenHeader` | `title`, `left?`, `right?`, `hidden?` | Header da própria Screen (§7.1). 3 slots: `left` · `title` centralizado · `right`, os laterais com `flex: 1` + `minWidth: 0` para o título ficar centrado e truncar. `bgElevated` + borda inferior, `padding 14/16` (`space.14`/`space.5`). `hidden` desliza para cima com `motion.slow` — usado na gravação imersiva |
| `NavBar` | `active: ScreenId`, `onChange`, `hidden?` | Vive no `App.tsx` (§7.2). 5 itens, ícone `xl` + label `micro`. Ativo = `accent`, inativo = `textMuted`. `hidden` desce com `motion.slow` |
| `Card` | `padded?: boolean` | Superfície padrão de conteúdo: `bgCard`, borda `border`, `radius.lg`, `elevation.1` |
| `ScreenContainer` | `scroll?: boolean`, `navPadding?: boolean` | `ScrollView` com `padding 16`, `paddingTop` = `space.8` + inset de topo, e `paddingBottom` = altura da NavBar **já com o inset dela** (`64 + inset.bottom + space.5`, e `false` remove). Elimina a repetição de padding em todas as telas |

### 6.3 `features/`

| Componente | Contrato | Notas |
|---|---|---|
| `SensorStatusChip` | `status`, `onPress` | Chip no header da Home: `Radio` 20px + `StatusDot`. Pressionar navega para Calibração |
| `Inclinometer` | `roll: number`, `trim: number`, `size?` | SVG (`react-native-svg`), sem card — solto sobre o `bg`. Nível 1: anel com furo central, escala de Roll 0→180 nos dois sentidos, âmbar, ponteiro fixo no topo. Nível 2: régua de Trim (±90°, marcas 30/60/90) visível pelo furo, desliza verticalmente, leitura por linha tracejada central fixa |
| `RecordButton` | `mode: idle \| recording \| paused`, `onPress` | Círculo 68px, fundo `rec`, `elevation.2`. `idle`: núcleo branco 30px (`Circle` preenchido). `recording`: `Pause`. `paused`: `Play`. Preso no rodapé acima da NavBar (idle) ou no centro da barra de gravação |
| `RecordingBar` | `mode`, `onCancel`, `onToggle`, `onSave` | Substitui a NavBar durante a gravação: `X` (danger) à esquerda, botão redondo central, `Check` (ok) à direita, `gap 44`, `paddingBottom` de safe-area |
| `Timer` | `elapsedMs`, `paused?` | Pill no lugar do header durante a gravação. `mm:ss · mmm` tabular, `display`, cor `accent` |
| `LineChart` | `series: { values, color, name }[]`, `scale`, `xLabels`, `yLabels?`, `height?` | SVG. Grade `chartGrid`, rótulos `chartAxis` `caption`, `tabular-nums`. Legenda com dot 8px + nome `caption` |
| `Gauge` | `value`, `min`, `max`, `lowMark`, `highMark` | Arco SVG para a abertura em graus: arco de fundo `chartGrid`, arco entre mínimo e máximo em `accent`, dois indicadores (menor `ok`, maior `accent`) |
| `FilterChips` | `groups`, `value`, `onChange` | Grupos rotulados (`caption` `textMuted`) com linha de `Chip`s rolável |
| `ReportCard` | `report`, `onPress` | `ListRow` com `title` + `date` à direita na linha 1 e `location` (`—` quando vazio) na linha 2. Title/location com ellipsis |

### 6.4 Regras transversais de componente

- Todo componente interativo define `accessibilityRole`, `accessibilityLabel` e `accessibilityState`.
- Nenhum componente de `ui/` recebe prop de domínio (`roll`, `sensor`, `report`…). Se precisar, não pertence a `ui/`.
- Estilo vive em `StyleSheet.create` no próprio arquivo ou no StyleSheet do componente; **nunca** número solto de padding/margem — só tokens de §3.

---

## 7. Layout e estrutura

### 7.1 Divisão de responsabilidades: App × Screen

Esta é a regra estrutural mais importante da camada de apresentação.

```
┌──────────────────────────────────────┐
│  App.tsx                            │  ← NavBar mora AQUI
│  ┌────────────────────────────────┐  │
│  │  Screen (Home/Calibração/…)    │  │  ← ScreenHeader mora AQUI
│  │  ┌──────────────────────────┐  │  │
│  │  │  <ScreenHeader />        │  │  │
│  │  ├──────────────────────────┤  │  │
│  │  │                          │  │  │
│  │  │  conteúdo rolável        │  │  │
│  │  │                          │  │  │
│  │  └──────────────────────────┘  │  │
│  │   [ botão de gravar ]          │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │  <NavBar />                    │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

- **`App.tsx` contém apenas:** o container (`flex: 1`, `bg`), a área da Screen (`flex: 1`) e a `<NavBar>`. Mais o estado de navegação. Nada mais.
- **Cada Screen renderiza o seu `<ScreenHeader>`**, porque cada tela tem título, `left` e `right` próprios (o chip de sensor só existe na Home; o `‹` + `⋮` só existem no Relatório).
- O header **não** é fixo por padrão: rola junto com o conteúdo (`ScrollView`). Só durante a gravação ele trava e some, porque o cronômetro ocupa aquele lugar.
- A Screen tem `paddingBottom` igual à altura da NavBar já com o inset dela (64 + safe-area), exceto nas telas sem NavBar (`navPadding={false}`). Ver §7.3.

### 7.2 Navegação

Navegação por estado, sem biblioteca:

- `ScreenId` = `'home' | 'calibration' | 'reports' | 'reportDetail' | 'integrity' | 'settings'`.
- `useState<ScreenId>` em `App.tsx`; a NavBar troca entre as 5 tabs.
- **`reportDetail` está fora das tabs.** Ao abrir, a NavBar é ocultada (`hidden`); ao voltar (botão `‹`), ela reaparece. É a única tela sem NavBar, conforme o protótipo.
- Para que o `‹ voltar` reapareça a NavBar junto com a tela, voltar é o mesmo `setScreen('reports')` que a tab aciona — não há pilha de histórico.
- A lista de tabs (id, label, ícone Lucide) é uma **constante** — `navigation/routes.ts` é a fonte única, consumida pela `NavBar`.

### 7.3 Safe area

`StatusBar` com `style="light"` (fundo escuro exige conteúdo claro).

O inset é medido por `react-native-safe-area-context` e **consumido por borda**, não por um `SafeAreaView` em volta de tudo. A diferença é visível no aparelho com notch:

| Borda | Quem consome | Por quê |
|---|---|---|
| Topo | `ScreenContainer` (`paddingTop`) | O `<ScreenHeader>` é filho dele, então empurrar o container empurra o header junto. |
| Fundo | `NavBar` (`paddingBottom`) | A barra encosta no gesto do sistema e a borda de 1px fica colada nele. |
| Fundo, na Screen | `ScreenContainer` (`paddingBottom`) | §7.1: a tela reserva `64 + inset.bottom`. Como a NavBar cresce com o inset, a altura total a reservar também cresce. |

Um `SafeAreaView` no container aplicaria o mesmo inset nas duas bordas de uma vez, empurrando a NavBar para *abaixo* do gesto em vez de deixá-la encostar nele. Por isso ele não é usado: o `SafeAreaProvider` fica na raiz e só mede.

Somar o inset de baixo nos dois lugares não é dupla contagem — é a mesma medida vista das duas pontas: a NavBar cresce para `64 + inset`, e a tela reserva `64 + inset`. `RecordingBar` segue a NavBar nesse ponto.

### 7.4 Estrutura de pastas proposta

```
src/
  index.ts                  # registro do componente raiz (registerRootComponent)
  App.tsx                   # shell: container + <Screen/> + <NavBar/> + estado de navegação
  navigation/
    routes.ts               # ScreenId + TABS (id, label, ícone Lucide) — fonte única das rotas
  style/
    theme.ts                # tokens: colors · spacing · radii · typography · elevation · motion
    app.ts                  # StyleSheet do shell (container, área da tela, área flutuante)
  app/
    screens/
      HomeScreen.tsx            # Medição        — header + Inclinometer + RecordButton
      CalibrationScreen.tsx     # Calibragem     — header + tabela de sensores + botão de calibrar
      ReportsScreen.tsx         # Relatórios     — header + busca/filtro + lista
      ReportDetailScreen.tsx    # Relatório      — header com voltar + ⋮, SEM NavBar
      IntegrityTestScreen.tsx   # Testes         — header + conteúdo
      SettingsScreen.tsx        # Configurações  — header + conteúdo
    components/
      layout/
        ScreenHeader.tsx
        NavBar.tsx
        Card.tsx
        ScreenContainer.tsx     # ScrollView com padding lateral e paddingBottom da NavBar
      ui/
        Button.tsx
        IconButton.tsx
        Chip.tsx
        StatusDot.tsx
        Modal.tsx
        Input.tsx
        ListRow.tsx
        Divider.tsx
        EmptyState.tsx
        Toast.tsx
      features/
        Inclinometer.tsx
        RecordButton.tsx
        RecordingBar.tsx
        Timer.tsx
        LineChart.tsx
        Gauge.tsx
        SensorStatusChip.tsx
        FilterChips.tsx
        ReportCard.tsx
  core/                    # intocado — sensors, processing, hooks, types
  __tests__/
  assets/
  app.json
  jest.config.js
  tsconfig.json
```

Mudanças em relação a `src/` hoje:

1. `style/app.ts` deixa de carregar a paleta e passa a ser só o StyleSheet do shell — as cores migram para `style/theme.ts`. **A paleta clara atual é removida**: o app passa a ser escuro (§1).
2. `Inclinometer.tsx` sai de `app/components/` para `app/components/features/`.
3. Entra `navigation/routes.ts` para que `App.tsx` e `NavBar.tsx` não dupliquem a lista de tabs.
4. Entra `app/components/layout/ScreenContainer.tsx` para que todas as telas repitam o mesmo padding e scroll.

### 7.5 Fronteira com o `core`

Imediatamente mantida: a camada de apresentação **só** conversa com o `core/` pelo hook `useInclination`. Nenhum `screen/` ou `components/` importa `expo-sensors`, `FilterService` ou `AngleConverter` diretamente. `Inclinometer` recebe `roll` e `trim` prontos — é um componente de desenho, cego ao pipeline.

### 7.6 Onde o Tamagui entra — e onde não entra

Os tokens (§1–§4) são tokens do [Tamagui](https://tamagui.dev), criados em `tamagui.config.ts` por `createTokens` e consumidos como referências `$token`. O `TamaguiProvider` fica na raiz, acima do shell.

`ui/` e `layout/` usam primitivas do Tamagui (`YStack`, `XStack`, `SizableText`, `ScrollView`, `styled`). Onde a primitiva é adequate — `Card`, `Chip`, `Button`, `ListRow`, `ScreenHeader` — o componente **é** a primitiva, com a identidade em `styled`.

Onde não é, o Tamagui é deliberadamente ausente:

| Componente | Por que fica em React Native |
|---|---|
| `Inclinometer` | Desenho SVG a 60 Hz (`react-native-svg`) + `Animated` para o ponteiro e a régua. É o componente mais otimizado do app e não tem equivalente no Tamagui — mexer nele seria trocar um desenho afinado por uma abstração genérica. |
| `Modal` | `Modal` nativo do RN + `Animated` para entrada/saída. O `Dialog` do Tamagui puxa `Popper`, que depende de `react-dom` — um caminho de web num app Android. |
| `Toast`, `NavBar`, `ScreenHeader`, `ScreenContainer` | As animações de esconder/somar usam `Animated` do RN com `useNativeDriver`. A casca e o layout migraram para Tamagui; o que se move é RN. |

E o inverso: `style/theme.ts` é uma **fachada**, não uma cópia. Os literais de cor, espaçamento, raio, tamanho e fonte são declarados uma vez em `tamagui.config.ts` e reexportados. A fachada existe porque `Inclinometer.tsx` — que não muda — usa `StyleSheet.create` com `colors`, `radii`, `spacing` e `typography`, e `StyleSheet` não entende referências `$token`.

**Regra prática:** um componente novo nasce Tamagui. Só sai de lá quando o trabalho depende de algo que o Tamagui não faz melhor — SVG de alta frequência, `Modal` nativo, animação com `useNativeDriver` em cascata.

---

## 8. Usabilidade em campo

O app é operado no convés, com uma mão só, às vezes com sujeira, e frequentemente sob sol forte. Regras que **sobrepõem** qualquer preferência estética:

| Regra | Valor |
|---|---|
| Alvo de toque mínimo | 44×44 dp — todo botão interativo, incluindo os de ícone |
| Alvo do botão de gravar | 68 dp (idle) e 60 dp (barras laterais) |
| Leitura numérica | `display` no mostrador, sempre com unidade e sinal quando negativo |
| Ação por gesto | Proibida — nenhuma informação essencial só por swipe, pinch ou long-press |
| Cor isolada | Proibida — cor sempre acompanhada de ícone ou texto |
| Bloqueio da tela | A falta de calibração **não** impede medir: vira aviso no header e sugestão de calibrar |
| Toque acidental | O botão de gravar exige a **dupla confirmation** só na saída (salvar/cancelar pedem confirmação), não no início |
| Formulário numérico | `keyboardType="numeric"` no input de título só se numérico; teclado padrão nos demais |
| Áudio/vibração | Fora do MVP — sem `expo-haptics`; feedback é visual |

---

## 9. Mapa proto → app

Como as decisões do protótipo se translatem no app:

| Padrão no `proto/` (CSS) | No app (RN) |
|---|---|
| Variáveis CSS em `:root` | `style/theme.ts` |
| `position: fixed` (navbar, botão de gravar, overlay) | Fora do fluxo normal: `position: 'absolute'` dentro do container do shell, ou na ordem flex que substitui a NavBar |
| `display: fixed` + `transform: translateY(100%)` para esconder a navbar | `Animated` com `translateY` de `navHeight` → `0`; `pointerEvents` desabilitado no final |
| `env(safe-area-inset-*)` | `SafeAreaView` / `useSafeAreaInsets` |
| `animation: rec-in 0.4s` | `Animated` + `Timing` com `motion.slow` |
| `@keyframes spinner` girando | `Animated.loop` com `Rotate` |
| Gradiente radial do botão de gravar | Sem gradiente nativo no RN: `expo-linear-gradient` **não** é dependência nova permitida — usar `bgCard` + anel `rec` com `borderWidth` ou ícone `Circle` preenchido |
| `text-overflow: ellipsis` | `numberOfLines={1}` |
| `box-shadow` | Par `elevation` + `shadow*` (§3.3) |
| SVG inline (`Inclinometer.jsx`, `LineChart.jsx`) | `react-native-svg` (já é dependência) |
| `env(safe-area-inset-bottom)` no padding da nav | `paddingBottom` da safe-area |

> **Atenção — gradiente do botão de gravar:** `radial-gradient` não existe nativamente em RN. A decisão aqui é usar fundo sólido `rec` + `elevation.2` + `Circle` branco preenchido no centro, que preserva a leitura de "botão de gravar" sem adicionar `expo-linear-gradient`. Se o gradiente for requisito visual, é uma dependência a discutir.

---

## 10. Pendências

Antes de implementar:

1. **`lucide-react-native@1.49.0`** precisa ser instalado (`npm install lucide-react-native`). Peer deps já satisfeitas: `react@19` e `react-native-svg@15`.
2. **`core/` está vazio** (`SensorService`, `FilterService`, `AngleConverter`, `useInclination`, `Inclinometer` com 0 bytes) e o `tsc --noEmit` já falha por isso. É pré-requisito para qualquer tela nova.
3. **`app.json`** ainda declara `"userInterfaceStyle": "light"` e `adaptiveIcon.backgroundColor: "#E6F4FE"` — precisam passar a `dark` para o sistema não inverter o header nativo.
4. **Telas `Testes` e `Configurações`** continuam sem especificação funcional (ver `TELAS.md`); só o cabeçalho e a moldura estão definidos aqui.
5. **`ReportDetailScreen`** consome dados que hoje são mockados no `proto/` — definir o modelo persistido (`Report`) junto com a camada de persistência local.