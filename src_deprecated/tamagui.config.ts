/**
 * Config do Tamagui — a fonte única de token do app.
 *
 * Os valores aqui vêm de `DESIGN.md` §1–§3 e são deliberadamente os do
 * protótipo "Escuro Instrument": o Tamagui é o *registro* de tokens (tipado,
 * validado na criação, trocável em um lugar só), não uma fonte de valores
 * emprestados. Nada aqui segue a escala default do Tamagui.
 *
 * Duas divergências conscientes em relação à escala default:
 *
 * 1. As chaves são semânticas (`s4`, `pill`, `accent`), não `$1..$16`. O
 *    DESIGN.md §3.1 define uma escala base 4 com nomes próprios e o §6.4 proíbe
 *    número solto — chave semântica é o que torna a referência legível.
 * 2. Existe `s14: 14`, fora da escala base 4, porque §6.1 (`Input` com
 *    `padding 12/14`) e §6.2 (`ScreenHeader` com `padding 14/16`) pedem 14 e a
 *    escala não tem essa casa. Sem este token esses dois componentes só teriam
 *    12, e o DESIGN.md passaria a mentir sobre o próprio layout.
 *
 * `style/theme.ts` reexporta tudo daqui com os mesmos nomes de antes — é ele
 * que `core/`, `features/Inclinometer.tsx` e `app/screens/HomeScreen.tsx`
 * importam, e por isso esses arquivos não mudam nesta migração.
 */

import { createAnimations } from '@tamagui/animations-react-native';
import { createTamagui, createTokens } from '@tamagui/core';
import type { VariableVal } from '@tamagui/web';

// ---------------------------------------------------------------------------
// §1 — Cor
// ---------------------------------------------------------------------------

/**
 * Superfícies, semânticas e domínio num único grupo `color`.
 *
 * São os mesmos objetos que `theme.ts` exportava (`surfaceColors`,
 * `semanticColors`, `domainColors`), preservados como literais separados porque
 * o `DESIGN.md` §1 os documenta em três blocos com finalidades distintas.
 */
export const surfaceColors = {
  bg: '#0B1220',
  bgElevated: '#111A2E',
  bgCard: '#16203A',
  bgInput: '#0D1526',
  overlay: 'rgba(4, 8, 16, 0.72)',
  shadow: '#000000',
  /** Hairline de 1px — a única borda permitida no sistema. */
  border: '#22304F',
} as const;

export const semanticColors = {
  text: '#E8EDF6',
  textMuted: '#8B98B4',
  textFaint: '#5E6B87',
  accent: '#F5A623',
  accentStrong: '#FFB93F',
  accentSoft: 'rgba(245, 166, 35, 0.12)',
  ok: '#34C98A',
  /** Colisão deliberada com `accent`: "atenção" e "marca" são a mesma família. */
  warn: '#F5A623',
  danger: '#FF5C5C',
  dangerSoft: 'rgba(255, 92, 92, 0.14)',
  /** Vermelho saturado do botão de gravar — ≠ `danger`. */
  rec: '#E13B3B',
  /** Tinta escura para texto sobre `accent`/`ok`. */
  onAccent: '#1A1505',
  onOk: '#05150D',
} as const;

export const domainColors = {
  roll: '#F5A623',
  trim: '#4AA3FF',
  chartGrid: '#1C2842',
  chartAxis: '#8B98B4',
} as const;

export const colors = {
  ...surfaceColors,
  ...semanticColors,
  ...domainColors,
} as const;

// ---------------------------------------------------------------------------
// §2 — Tipografia
// ---------------------------------------------------------------------------

/**
 * Papéis tipográficos (§2.1).
 *
 * Sem `fontFamily`: o DESIGN.md §2 define Roboto do sistema e zero assets de
 * fonte. Deixar a família indefinida é o que faz o Tamagui usar a fonte da
 * plataforma em vez de tentar carregar uma.
 *
 * `fontVariant: ['tabular-nums']` (§2.2) **não** cabe num token de fonte do
 * Tamagui, então continua exportado separado por `theme.ts` como `tabular`.
 */
export const fonts = {
  display: { fontSize: 40, lineHeight: 40, fontWeight: '800' },
  title: { fontSize: 17, lineHeight: 17, fontWeight: '700' },
  heading: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  caption: { fontSize: 11, lineHeight: 15, fontWeight: '700' },
  micro: { fontSize: 10, lineHeight: 14, fontWeight: '500' },
} as const;

// ---------------------------------------------------------------------------
// §3 — Espaçamento, raios e tamanhos
// ---------------------------------------------------------------------------

/** Escala base 4, mais o `s14` que §6.1/§6.2 exigem. */
export const space = {
  s1: 2,
  s2: 4,
  s3: 8,
  s4: 12,
  s14: 14,
  s5: 16,
  s6: 20,
  s7: 24,
  s8: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

/** Tamanhos de ícone (§5.2) e as três medidas de casca que não são de ícone. */
export const size = {
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  /** Só o `EmptyState` (§6.1) — fora da tabela de §5.2 porque é ilustração. */
  hero: 40,
  /** Alvo de toque mínimo (§8). */
  touch: 44,
} as const;

export const zIndex = {
  base: 0,
  raised: 10,
  nav: 20,
  overlay: 30,
  toast: 40,
} as const;

export const tokens = createTokens({
  color: colors,
  space,
  size,
  radius,
  zIndex,
  /**
   * Cast apenas por limitação de tipo do Tamagui, não por escolha de valor.
   *
   * Em `MakeTokens`, o grupo `font` cai no branch `Omit<...>` e cada entrada é
   * normalizada para `VariableVal` (= `string | number | boolean | Variable`),
   * tipo que não comporta `{ fontSize, lineHeight, fontWeight }`. O runtime
   * está correto — `tokens.font.body` existe e resolve no provider — mas o
   * `tsc` rejeita o literal. Tipar os fontes como `Record<string, VariableVal>`
   * deixa de descrever a verdade; manter o `as const` acima e validar em teste
   * é o trade-off honesto.
   */
  font: fonts as unknown as Record<string, VariableVal>,
});

export type AppTokens = typeof tokens;

// ---------------------------------------------------------------------------
// §4 — Movimento
// ---------------------------------------------------------------------------

/**
 * O driver do React Native (`@tamagui/animations-react-native`) roda na thread
 * do JS com a `Animated` que o app já usa e **não acrescenta dependência
 * nativa** — escolha deliberada contra `@tamagui/animations-reanimated`, cujo
 * off-thread exigiria `react-native-reanimated` + worklets, com histórico de
 * regressões de memória e startup no SDK 57.
 *
 * Os nomes do app seguem `DESIGN.md` §4. As molas são o que o driver RN suporta
 * nativamente (`mass`, `damping`, `stiffness`); as durações em ms continuam
 * disponíveis em `theme.ts > motion` para o código que anima direto com
 * `Animated`, como o `Spinner`.
 *
 * ## Os dois vocabulários
 *
 * `fast` · `base` · `exit` · `slow` são os que o DESIGN.md nomeia, e o código do
 * app é quem passa o nome — nenhum componente do app pede `animation` sozinho.
 *
 * A UI kit, essa, pede. `Collapsible`, `Accordion`, `Dialog`, `Popover` e o
 * `Toaster` passam o nome que o Tamagui usa por omissão, e esses nomes não são
 * os do DESIGN.md. Sem eles no registro o driver cai em
 * `animations[nomeInexistente]` → `{}` e a transição **não acontece**: sem erro,
 * sem aviso, o componente só salta entre os estados. Como §4 é a única fonte dos
 * movimentos, os nomes do kit são registrados aqui também — apontando para as
 * mesmas molas, não para molas novas.
 */
export const animations = createAnimations({
  fast: { type: 'spring', mass: 0.7, damping: 26, stiffness: 420 },
  base: { type: 'spring', mass: 0.9, damping: 24, stiffness: 300 },
  exit: { type: 'spring', mass: 0.8, damping: 32, stiffness: 260 },
  /** Mola do `Pressable` e do `Spinner` — o ciclo contínuo de §4. */
  slow: { type: 'spring', mass: 1.1, damping: 20, stiffness: 180 },

  // Vocabulário da UI kit, nas molas de §4.
  quick: { type: 'spring', mass: 0.7, damping: 26, stiffness: 420 },
  snappy: { type: 'spring', mass: 0.9, damping: 24, stiffness: 300 },
  gentle: { type: 'spring', mass: 0.9, damping: 24, stiffness: 300 },
  bouncy: { type: 'spring', mass: 1.1, damping: 20, stiffness: 180 },
  toast: { type: 'spring', mass: 0.8, damping: 32, stiffness: 260 },
  overlay: { type: 'spring', mass: 0.9, damping: 24, stiffness: 300 },
  focus: { type: 'spring', mass: 0.7, damping: 26, stiffness: 420 },
});

// ---------------------------------------------------------------------------
// Tema
// ---------------------------------------------------------------------------

/**
 * Um tema só. O DESIGN.md §1 define a app inteira como dark ("Escuro
 * Instrument") e o `app.json` está em `userInterfaceStyle: dark`, então não há
 * tema light para alternar ainda.
 *
 * As chaves `background`/`color` são as que os componentes da UI kit do Tamagui
 * leem por padrão; as demais espelham `tokens.color` para que `useTheme()` e
 * `$accent` cheguem ao mesmo lugar que `colors.accent`.
 */
const theme = {
  bg: colors.bg,
  bgElevated: colors.bgElevated,
  bgCard: colors.bgCard,
  bgInput: colors.bgInput,
  border: colors.border,
  shadow: colors.shadow,

  text: colors.text,
  textMuted: colors.textMuted,
  textFaint: colors.textFaint,

  accent: colors.accent,
  accentStrong: colors.accentStrong,
  accentSoft: colors.accentSoft,
  ok: colors.ok,
  warn: colors.warn,
  danger: colors.danger,
  dangerSoft: colors.dangerSoft,
  rec: colors.rec,
  onAccent: colors.onAccent,
  onOk: colors.onOk,

  roll: colors.roll,
  trim: colors.trim,
  chartGrid: colors.chartGrid,
  chartAxis: colors.chartAxis,

  overlay: colors.overlay,

  /** Exigido pela UI kit. */
  background: colors.bg,
  color: colors.text,
  placeholderColor: colors.textFaint,
  borderColor: colors.border,
  outlineColor: colors.border,
  shadowColor: colors.shadow,

  /**
   * Tints de interação (`DESIGN.md` §4 — os mesmos estados que o `Pressable`
   * sempre teve, agora nomeados).
   *
   * A UI kit do Tamagui não desenha o estado pressionado: ela **pede** estas
   * chaves ao tema. `Switch`, `Checkbox`, `Slider`, `RadioGroup`, `ListItem`,
   * `Accordion`, `Tabs` e o próprio `Button` citam `backgroundHover`,
   * `backgroundPress`, `backgroundFocus`, `borderColorHover`, `borderColorPress`,
   * `borderColorFocus` e `colorPress` nos próprios estilos. Chave ausente não é
   * erro: resolve para `undefined` e o estado simplesmente não acontece — o
   * botão fica igual pressionado e solto, e ninguém percebe no código.
   *
   * São os únicos valores do tema que **não** vêm de §1, porque §1 define
   * superfícies e inks, não interações. São véus de `text` sobre a superfície
   * (`text` a 4% no hover, 8% no press) mais o `accent` no foco — a mesma
   * receita de "hover clareia, press afunda" que o protótipo usava, agora com
   * um número em vez de uma cor nova na paleta.
   */
  backgroundHover: 'rgba(232, 237, 246, 0.04)',
  backgroundPress: 'rgba(232, 237, 246, 0.08)',
  backgroundFocus: colors.accentSoft,
  borderColorHover: 'rgba(232, 237, 246, 0.16)',
  borderColorPress: 'rgba(232, 237, 246, 0.24)',
  borderColorFocus: colors.accent,
  colorPress: colors.textMuted,
} as const;

export const appConfig = createTamagui({
  tokens,
  themes: { dark: theme },
  animations,
  defaultTheme: 'dark',
});

export type AppConfig = typeof appConfig;

export default appConfig;