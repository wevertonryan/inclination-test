/**
 * Tokens do design system — "Escuro Instrument".
 *
 * Implementação de [`DESIGN.md` §1–§4](../../DESIGN.md). Este arquivo é a única
 * fonte de cor, espaçamento, raio, tipografia, elevação e movimento do app:
 * nenhum componente usa número literal (ver `DESIGN.md` §6.4).
 *
 * `style/app.ts` reexporta tudo daqui, então `style/app` é a porta de entrada
 * única do design para o resto do projeto.
 */

import { Easing, type TextStyle, type ViewStyle } from 'react-native';

// ---------------------------------------------------------------------------
// §1 — Cor
// ---------------------------------------------------------------------------

/** Superfícies, em três níveis de elevação (bg → bgElevated → bgCard). */
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

/** Conteúdo e semânticas. Cada cor tem um significado fixo (`DESIGN.md` §1.2). */
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

/** Cores de domínio — fixas, não acompanham o accent (`DESIGN.md` §1.3). */
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
 * Papéis tipográficos (`DESIGN.md` §2.1). `lineHeight` acompanha o tamanho em
 * ~1.4, exceto `display` e `title`, que centralizam verticalmente.
 */
export const typography = {
  display: { fontSize: 40, fontWeight: '800', lineHeight: 40, ...tabular },
  title: { fontSize: 17, fontWeight: '700', lineHeight: 17 },
  heading: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  body: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '700', lineHeight: 15 },
  micro: { fontSize: 10, fontWeight: '500', lineHeight: 14 },
} as const satisfies Record<TypographyRole, TextStyle>;

export type Typography = typeof typography;

// ---------------------------------------------------------------------------
// §3 — Espaçamento, raios e elevação
// ---------------------------------------------------------------------------

/** Escala base 4 (`DESIGN.md` §3.1). */
export const spacing = {
  s1: 2,
  s2: 4,
  s3: 8,
  s4: 12,
  s5: 16,
  s6: 20,
  s7: 24,
  s8: 32,
} as const;

export type SpacingToken = keyof typeof spacing;
export type Space = (typeof spacing)[SpacingToken];

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

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
  headerPaddingVertical: spacing.s4,
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

export const iconSize = {
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  /** Só o `EmptyState` (§6.1) — fora da tabela de §5.2 porque é uma ilustração. */
  hero: 40,
} as const;

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