/**
 * Gráfico da série ao vivo (`DESIGN.md` §6.3, §7.6).
 *
 * ## Por que SVG próprio, e não um pacote
 *
 * `@tamagui/charts` não existe mais no npm, e o `victory-native` que ele embrulha
 * hoje exige `@shopify/react-native-skia`, `gesture-handler` e `reanimated` como
 * peers — um módulo nativo pesado e um driver de render diferente do `Animated` que
 * o `Inclinometer` usa, por um gráfico de duas poligonais.
 *
 * Então isto é a exceção que §7.6 já prevê: SVG, porque o desenho tem que ser
 * re-desenhado a cada tique do gravador (10 Hz, `useRecorder.tickMs`). A matemática
 * da poligonal vem do `proto/src/components/LineChart.jsx`, que já fazia isso em 50
 * linhas; o que este acrescenta é o que §6.3 pede e o protótipo não tinha: grade,
 * rótulos de eixo e legenda.
 *
 * ## Por que o eixo x é `elapsedMs` e não o índice
 *
 * Índice presume amostras regulares. Não são: uma pausa e uma falha de disco
 * criam buracos. `elapsedMs` é o que está no disco, então o gráfico estica o vão em
 * vez de mentir com uma linha contínua.
 *
 * ## A escala tem piso
 *
 * O protótipo usa `max|v| × 1,15`. Em um barco parado isso é ~0, e o gráfico
 * amplifica o ruído do sensor até virar uma serra que sugere adernamento onde não
 * houve. O piso de 5° é a menor leitura que ainda significa alguma coisa neste
 * instrumento.
 */

import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { colors, formatInteger, radii, spacing, tabular, typography } from '../../../style/app';

export interface ChartSeries {
  readonly values: readonly number[];
  readonly color: string;
  readonly name: string;
}

export interface LineChartProps {
  series: readonly ChartSeries[];
  /** Escala fixa em graus. Sem ela, a escala se ajusta à janela. */
  scale?: number;
  /** Rótulos do eixo x, já formatados. */
  xLabels?: readonly string[];
  /** Altura da área de plotagem, sem a legenda. */
  height?: number;
}

const PLOT_HEIGHT = 150;
/** Coluna dos rótulos de y. */
const GUTTER = spacing.s8;
/** Faixa dos rótulos de x, embaixo da plotagem. */
const FOOTER = spacing.s4;
/** Diâmetro do ponto de legenda. */
const DOT = 8;
/** Escala mínima: 5° é a menor diferença que este instrumento resolve. */
const MIN_SCALE = 5;
/** Reserva lateral para a linha não encostar na borda do card. */
const HORIZONTAL_PAD = spacing.s2;

export function LineChart({ series, scale, xLabels, height = PLOT_HEIGHT }: LineChartProps) {
  const [width, setWidth] = useState(0);

  const plotWidth = Math.max(0, width - GUTTER - HORIZONTAL_PAD * 2);
  const halfHeight = height / 2;

  const magnitude = useMemo(() => {
    let peak = 0;
    for (const line of series) {
      for (const value of line.values) {
        const abs = Math.abs(value);
        if (Number.isFinite(abs) && abs > peak) peak = abs;
      }
    }
    return peak;
  }, [series]);

  // `scale` fixo quando informado e positivo; senão o automático com o piso.
  const resolvedScale =
    scale !== undefined && Number.isFinite(scale) && scale > 0
      ? scale
      : Math.max(magnitude * 1.15, MIN_SCALE);

  const ticks = useMemo(
    () => [-resolvedScale, -resolvedScale / 2, 0, resolvedScale / 2, resolvedScale],
    [resolvedScale],
  );

  /** Posição vertical de um valor: zero no meio, grow para cima. */
  const toY = (value: number): number =>
    halfHeight - (value / resolvedScale) * (halfHeight - HORIZONTAL_PAD);

  /** Converte uma série na lista `points` de um `Polyline`. */
  const toPoints = (values: readonly number[]): string => {
    if (values.length === 0 || plotWidth <= 0) return '';

    const step = values.length > 1 ? plotWidth / (values.length - 1) : 0;

    return values
      .map((value, index) => {
        const x = GUTTER + index * step;
        const y = Math.min(height - HORIZONTAL_PAD, Math.max(HORIZONTAL_PAD, toY(value)));
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  };

  const hasData = series.some((line) => line.values.length > 0);

  /**
   * A largura só existe depois do `onLayout`, e um `<Svg width={0}>` desenha
   * absolutamente nada. A versão anterior desenhava o SVG de qualquer jeito: o
   * usuário via um retângulo vazio, e o "Sem amostras ainda" não aparecia porque
   * `hasData` era verdadeiro — resultado, um gráfico que parecia travado. Agora o
   * SVG espera a medida, e o texto de espera aparece sempre que há mesmo o que
   * mostrar.
   */
  const ready = width > 0;

  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} testID="live-chart">
      <View style={styles.plot}>
        {ready ? (
          <Svg width={width} height={height}>
          {/* Grade + rótulos de y. A linha do zero é a mais forte: é a
              referência de "seminclinação", e é o que o olho procura primeiro. */}
          {ticks.map((tick) => {
            const y = toY(tick);

            return (
              <G key={tick}>
                <Line
                  x1={GUTTER}
                  x2={width - HORIZONTAL_PAD}
                  y1={y}
                  y2={y}
                  stroke={tick === 0 ? colors.chartAxis : colors.chartGrid}
                  strokeWidth={tick === 0 ? 1.5 : 1}
                />
                <SvgText
                  x={GUTTER - spacing.s2}
                  y={y}
                  fill={colors.chartAxis}
                  fontSize={typography.caption.fontSize}
                  fontWeight={typography.caption.fontWeight}
                  textAnchor="end"
                  alignmentBaseline="middle"
                >
                  {formatInteger(tick)}
                </SvgText>
              </G>
            );
          })}

          {series.map((line) =>
            line.values.length > 1 ? (
              <Polyline
                key={line.name}
                points={toPoints(line.values)}
                fill="none"
                stroke={line.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : null,
          )}

          {/* Menos de duas amostras não é uma série, é um ponto. Sem ele o
              Polyline some e o usuário lê "não há dados" quando há um dado. */}
          {series.map((line) =>
            line.values.length === 1 ? (
              <Circle
                key={`${line.name}-ponto`}
                cx={GUTTER}
                cy={toY(line.values[0])}
                r={3}
                fill={line.color}
              />
            ) : null,
          )}
          </Svg>
        ) : null}

        {!hasData ? (
          <View style={styles.vazio} pointerEvents="none">
            <Text style={styles.vazioTexto}>Sem amostras ainda</Text>
          </View>
        ) : null}
      </View>

      {xLabels !== undefined && xLabels.length > 0 ? (
        <View style={styles.eixoX}>
          {xLabels.map((label, index) => (
            <Text key={`${label}-${index}`} style={styles.rotuloX}>
              {label}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.series}>
        {series.map((line) => (
          <View key={line.name} style={styles.item}>
            <View style={[styles.dot, { backgroundColor: line.color }]} />
            <Text style={styles.nome}>{line.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plot: {
    position: 'relative',
  },
  vazio: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vazioTexto: {
    ...typography.body,
    color: colors.textFaint,
  },
  eixoX: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: GUTTER,
    paddingRight: HORIZONTAL_PAD,
    paddingTop: FOOTER,
  },
  rotuloX: {
    ...typography.caption,
    ...tabular,
    color: colors.chartAxis,
  },
  series: {
    flexDirection: 'row',
    gap: spacing.s4,
    paddingLeft: GUTTER,
    paddingTop: spacing.s2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: radii.pill,
  },
  nome: {
    ...typography.caption,
    color: colors.chartAxis,
  },
});

export default LineChart;