/**
 * Tokens do design system — "Escuro Instrument".
 *
 * Implementação de [`DESIGN.md` §1–§4](../../DESIGN.md). Este arquivo é a única
 * fonte de cor, espaçamento, raio, tipografia, elevação e movimento do app:
 * nenhum componente usa número literal (ver `DESIGN.md` §6.4).
 *
 * `style/app.ts` reexporta tudo daqui, então `style/app` é a porta de entrada
 * única do design para o resto do projeto.
 *
 * ## Relação com o Tamagui
 *
 * A fonte única dos tokens agora é [`tamagui.config.ts`](../tamagui.config.ts):
 * os literais de cor, espaçamento, raio, tamanho e fonte são declarados lá uma
 * vez e alimentam o `createTokens`. Este arquivo é a **fachada** que os
 * reexporta — não uma segunda cópia.
 *
 * A fachada existe porque a migração é por etapas e a maior parte do app ainda
 * consome estilo pela API do React Native (`StyleSheet.create`, `TextStyle`,
 * `ViewStyle`). Servir as referências `$token` do Tamagui a esse código exigiria
 * que todo `StyleSheet` passasse a ser prop de componente Tamagui, o que é a
 * Fase 3 e não cabe aqui. Por isso a fachada expõe os **literais crus**
 * (`spacing.s5 === 16`, `colors.accent === '#F5A623'`), que funcionam
 * indistintamente em `StyleSheet` e como valor de prop Tamagui.
 *
 * Consequência a conhecer: `tokens.space.s14` é uma `Variable` (`{ val: 14 }`),
 * enquanto `spacing.s14` é o número. `__tests__/tamagui.primitives.test.tsx`
 * afirma sobre a `Variable` para que a escala não se dissocie do config.
 */

import { Easing, type TextStyle, type ViewStyle } from 'react-native';

import {
  domainColors,
  fonts,
  radius,
  semanticColors,
  size,
  space,
  surfaceColors,
} from '../tamagui.config';

// ---------------------------------------------------------------------------
// §1 — Cor
// ---------------------------------------------------------------------------

export { surfaceColors, semanticColors, domainColors };

export const colors = {
  ...surfaceColors,
  ...semanticColors,
  ...domainColors,
} as const;

export type Colors = typeof colors;

/** Escolha de tinta legível sobre cada fundo (`DESIGN.md` §1.4). */
export const onColor = {
  accent: colors.onAccent,
  ok: colors.onOk,
  danger: '#FFFFFF',
  rec: '#FFFFFF',
  bg: colors.text,
  bgElevated: colors.text,
  bgCard: colors.text,
  bgInput: colors.text,
} as const;

// ---------------------------------------------------------------------------
// §2 — Tipografia
// ---------------------------------------------------------------------------

export type TypographyRole =
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'label'
  | 'caption'
  | 'micro';

/**
 * Regra tabular — obrigatória em todo número (`DESIGN.md` §2.2).
 * Sem isso os dígitos mudam de largura e o valor "pula" a 60 Hz.
 */
export const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

/**
 * Aplica a regra tabular a um papel. Só o `display` numérico precisa dela, mas
 * a função existe para que "adicionar tabular a um papel" seja uma linha e não
 * um patch local — o erro que §2.2 existe para impedir é o número que "pula".
 */
const withTabular = <T extends TextStyle>(style: T): TextStyle => ({ ...style, ...tabular });

/**
 * Papéis tipográficos (`DESIGN.md` §2.1), derivados de `fonts` no config.
 * `lineHeight` acompanha o tamanho em ~1.4, exceto `display` e `title`, que
 * centralizam verticalmente.
 */
export const typography = {
  display: withTabular(fonts.display),
  title: withTabular(fonts.title),
  heading: withTabular(fonts.heading),
  body: withTabular(fonts.body),
  label: withTabular(fonts.label),
  caption: withTabular(fonts.caption),
  micro: withTabular(fonts.micro),
} satisfies Record<TypographyRole, TextStyle>;

export type Typography = typeof typography;

// ---------------------------------------------------------------------------
// §3 — Espaçamento, raios e elevação
// ---------------------------------------------------------------------------

/** Escala base 4 mais o `s14` que §6.1/§6.2 exigem (`DESIGN.md` §3.1). */
export const spacing = space;

export type SpacingToken = keyof typeof spacing;
export type Space = (typeof spacing)[SpacingToken];

export const radii = radius;

export type RadiusToken = keyof typeof radii;
export type Radius = (typeof radii)[RadiusToken];

/**
 * Elevação (`DESIGN.md` §3.3). No Android só `elevation` tem efeito; o par
 * `shadow*` é mantido para paridade com iOS/web — sempre aplicar os dois.
 */
export const elevation = {
  1: {
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  2: {
    elevation: 6,
    shadowColor: colors.shadow,
    shadowOpacity: 0.38,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },
  3: {
    elevation: 12,
    shadowColor: colors.shadow,
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
} as const satisfies Record<1 | 2 | 3, ViewStyle>;

export type ElevationLevel = keyof typeof elevation;

/** Medidas de casca — as duas únicas alturas que não saem da escala base 4. */
export const layout = {
  /** Altura da NavBar, sem safe-area (`DESIGN.md` §6.2). */
  navHeight: 64,
  /** Padding lateral padrão de tela e de card. */
  screenPaddingHorizontal: spacing.s5,
  /** Respiro do topo de tela. */
  screenPaddingTop: spacing.s8,
  /** §6.1 pede 14 aqui — por isso `s14` existe na escala. */
  headerPaddingVertical: spacing.s14,
  headerPaddingHorizontal: spacing.s5,
  /** Altura mínima do header, para a animação de saída ter um offset estável. */
  headerMinHeight: 48,
  /** Alvo de toque mínimo (§8). */
  touchTarget: 44,
  recordButtonSize: 68,
  sideRecordButtonSize: 60,
} as const;

// ---------------------------------------------------------------------------
// §4 — Movimento
// ---------------------------------------------------------------------------

export const motion = {
  fast: { duration: 120, easing: Easing.out(Easing.ease) },
  base: { duration: 180, easing: Easing.out(Easing.ease) },
  exit: { duration: 230, easing: Easing.in(Easing.ease) },
  slow: { duration: 400, easing: Easing.bezier(0.4, 0, 0.2, 1) },
} as const;

export type MotionToken = keyof typeof motion;

// ---------------------------------------------------------------------------
// §5 — Iconografia (Lucide, viewBox 24×24)
// ---------------------------------------------------------------------------

/**
 * Tamanhos de ícone (§5.2) e as três medidas de casca que não são de ícone.
 *
 * Reexporta o grupo `size` do config em vez de declarar de novo: `size` já
 * carrega o `hero` do `EmptyState` e o `touch` do alvo de toque (§8), e duas
 * listas de tamanho é exatamente como `s14` sumiria de novo.
 */
export const iconSize = size;

export type IconSizeToken = keyof typeof iconSize;
export type IconSize = (typeof iconSize)[IconSizeToken];

// ---------------------------------------------------------------------------
// §2.3 — Formatação numérica (locale pt-BR)
// ---------------------------------------------------------------------------

/** Menos tipográfico — o mesmo glifo que o protótipo usava. */
const MINUS = '\u2212';

function decimal(value: number, digits: number): string {
  return value.toFixed(digits).replace('.', ',');
}

/** Ângulo com 1 casa e unidade fora do número: `3,2°`, `−4,1°`, `0,0°`. */
export function formatAngle(value: number, unit = '°'): string {
  const v = Number.isFinite(value) ? value : 0;
  return `${v < 0 ? MINUS : ''}${decimal(Math.abs(v), 1)}${unit}`;
}

/** Grau inteiro da escala do anel: `30°`, `90°`, `180°`. */
export function formatDegrees(value: number): string {
  const v = Number.isFinite(value) ? value : 0;
  return `${v < 0 ? MINUS : ''}${Math.round(Math.abs(v))}°`;
}

/** Inteiro com separador de milhar pt-BR: `1.234`. */
export function formatInteger(value: number): string {
  const v = Math.round(Number.isFinite(value) ? value : 0);
  const grouped = Math.abs(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${v < 0 ? MINUS : ''}${grouped}`;
}

function pad(value: number, size: number): string {
  return Math.trunc(value).toString().padStart(size, '0');
}

/** Duração de relatório: `mm:ss`. */
export function formatDuration(ms: number): string {
  const safe = Math.max(0, Number.isFinite(ms) ? ms : 0);
  const totalSeconds = Math.round(safe / 1000);
  return `${pad(totalSeconds / 60, 2)}:${pad(totalSeconds % 60, 2)}`;
}

/** Cronômetro da gravação ao vivo: `mm:ss · mmm` (milésimos, separador `·`). */
export function formatStopwatch(ms: number): string {
  const safe = Math.max(0, Number.isFinite(ms) ? ms : 0);
  return `${pad(safe / 60000, 2)}:${pad((safe % 60000) / 1000, 2)} · ${pad(safe % 1000, 3)}`;
}

/** `dd/mm/aaaa` — data curta do card de relatório. */
export function formatShortDate(date: Date): string {
  return `${pad(date.getDate(), 2)}/${pad(date.getMonth() + 1, 2)}/${date.getFullYear()}`;
}

/** `hh:mm:ss` — hora do detalhe do relatório. */
export function formatTime(date: Date): string {
  return `${pad(date.getHours(), 2)}:${pad(date.getMinutes(), 2)}:${pad(date.getSeconds(), 2)}`;
}

// ---------------------------------------------------------------------------
// Pacote único
// ---------------------------------------------------------------------------

export const theme = {
  colors,
  onColor,
  spacing,
  radii,
  typography,
  tabular,
  elevation,
  motion,
  iconSize,
  layout,
} as const;

export type Theme = typeof theme;