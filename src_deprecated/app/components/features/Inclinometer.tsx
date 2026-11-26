/**
 * Inclinômetro ao vivo (`DESIGN.md` §6.3, layout de `PROTOTIPO.md` Home).
 *
 * Nível 1 — anel com furo central: escala de **Roll** de 0 a 180 nos dois
 * sentidos, âmbar, lida por um **ponteiro fixo no topo**. O anel gira no eixo e
 * o sinal vem de qual metade da escala está embaixo do ponteiro (`roll > 0` =
 * borda direita para baixo, como em qualquer inclinômetro de bordo).
 *
 * Nível 2 — régua de **Trim** (±90°, marcas 30/60/90 para os dois lados) visível
 * **através do furo** do anel, deslizando verticalmente e lida por uma linha
 * tracejada central fixa. `trim > 0` = proa para cima, então a régua desce.
 *
 * ## O contrato de performance
 *
 * O `useInclination` publica `roll`/`trim` como estado, a 60 Hz. O caminho
 * preguiçoso — um `<G transform={...}>` dentro de um `<Svg>` — faz essa
 * atualização atravessar o commit do React a cada amostra: a subárvore inteira do
 * SVG (~80 `Line`/`Text`) é reconciliada e ~80 props nativas são reaplicadas
 * por frame, além do render de quem está acima na tela.
 *
 * Aqui nada disso acontece:
 *
 * 1. **O `Inclinometer` é o único consumidor do `useInclination`** e dona o
 *    `start`/`stop`. Quem está acima não re-renderiza a 60 Hz.
 * 2. **A geometria estática é criada uma vez, no load do módulo** (`ROLL_SCALE`,
 *    `TRIM_RULER`, os paths). São os mesmos objetos de elemento em todos os
 *    renders, e as camadas ficam dentro de um `useMemo` que só depende das
 *    interpolações — que também são estáveis: o React nem desce na subárvore, e
 *    não há reconciliação de SVG nem prop nativa reaplicada pelo commit.
 * 3. **A rotação e a deslização saem por `transform` de View**, não por
 *    `transform` de `<G>`. O `react-native-svg` 15 não tem `transform` animável
 *    confiável na New Architecture (react-native-svg#2587), enquanto
 *    `rotate`/`translateY` de View estão no allowlist do módulo animado nativo
 *    (`NativeAnimatedAllowlist.js`).
 * 4. **Os ângulos vão para a UI thread** por `new Animated.Value(…, {
 *    useNativeDriver: true })`: o valor nasce nativo e cada `setValue` escreve
 *    direto no grafo animado nativo (`AnimatedValue.js` `__makeNative` /
 *    `setAnimatedNodeValue`) — sem animação, sem bridge, sem render.
 * 5. **Só a legenda re-renderiza** a 60 Hz, e é por isso que ela é `tabular`
 *    (`DESIGN.md` §2.2): sem números tabulares os dígitos mudam de largura e o
 *    valor "pula" horizontalmente enquanto gira.
 *
 * O que sobra por frame: 1 render desta função, 2 `setValue` e o texto da
 * legenda. O resto da tela não existe para o React.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { useInclination } from '../../../core/hooks/useInclination';
import type { Angles } from '../../../core/types';
import { colors, formatAngle, radii, spacing, tabular, typography } from '../../../style/app';

// ---------------------------------------------------------------------------
// Geometria — mesmas medidas do protótipo, em um viewBox de 260×260.
// O `size` do componente escala o viewBox inteiro, então nada aqui depende dele.
// ---------------------------------------------------------------------------

/** Lado do viewBox do mostrador. */
const VIEW_BOX = 260;

/** Diâmetro padrão em dp. */
export const DEFAULT_SIZE = VIEW_BOX;

const CX = VIEW_BOX / 2;
const CY = VIEW_BOX / 2;

/** Raio externo do anel. */
const R = 112;
/** Raio do furo central — por ele aparece a régua de trim. */
const HOLE = 62;
const TICK_OUT = 106;
const TICK_IN_MAJOR = 96;
const TICK_IN_MINOR = 101;
const LABEL_R = 78;
const STRIP_WIDTH = 46;
const STRIP_HALF = 76;

/**
 * Deslocamento máximo da régua, em unidades de viewBox: ±90° de trim não saem
 * da janela (76 + 52 = 128 < 130).
 */
export const TRIM_TRAVEL = 52;

const MAJOR_STEP = 30;
const MINOR_STEP = 10;
const MAX_ROLL = 180;
const MAX_TRIM = 90;

/** Passo da base 4, herdado do `motion.fast` da régua de tick. */
const MINOR_TICK_WIDTH = 1.5;
const MAJOR_TICK_WIDTH = 2;
const ROLL_LABEL_SIZE = 14;
const TRIM_LABEL_SIZE = 12;

const ROLL_COLOR = colors.roll;
const TRIM_COLOR = colors.trim;
const VIEW_BOX_PROP = `0 0 ${VIEW_BOX} ${VIEW_BOX}`;

/** Anel preenchido com o furo no meio — `evenodd` recorta o centro. */
const ANNULUS_PATH =
  `M ${CX} ${CY - R} A ${R} ${R} 0 1 1 ${CX} ${CY + R} A ${R} ${R} 0 1 1 ${CX} ${CY - R} Z` +
  ` M ${CX} ${CY - HOLE} A ${HOLE} ${HOLE} 0 1 0 ${CX} ${CY + HOLE} A ${HOLE} ${HOLE} 0 1 0 ${CX} ${CY - HOLE} Z`;

/** Ponteiro fixo do topo, do lado de fora do anel apontando para dentro. */
const POINTER_PATH =
  `M ${CX - 9} ${CY - R - 4} L ${CX + 9} ${CY - R - 4} L ${CX} ${CY - R + 16} Z`;

/** Índice do trim: a linha tracejada fixa, central, pela qual a régua passa. */
const TRIM_INDEX_HALF_WIDTH = HOLE - 8;

function polar(radius: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY - radius * Math.sin(rad) };
}

/**
 * Baseline do texto centrada verticalmente no ponto `y`.
 *
 * O `react-native-svg` 15 não implementa `dominant-baseline` — só
 * `alignmentBaseline`, que é iOS-only, e `verticalAlign`, que não é o
 * equivalente no Android. Descer a baseline por um fração do corpo da fonte
 * dá o mesmo resultado nos dois, sem depender de comportamento de plataforma.
 */
function centeredBaseline(y: number, fontSize: number) {
  return y + Math.round(fontSize * 0.36);
}

/** Ângulo não finito (sensor zerado, NaN do conversor) vira 0. */
function finiteOr(value: number) {
  return Number.isFinite(value) ? value : 0;
}

// ---------------------------------------------------------------------------
// Geometria estática — avaliada uma vez, no load do módulo.
//
// São os mesmos objetos de elemento em todos os renders: o React reconcilia a
// subárvore uma única vez, na montagem, e nunca mais desce nela.
// ---------------------------------------------------------------------------

function buildRollScale(): ReactNode {
  const marks: ReactNode[] = [];

  for (const dir of [1, -1]) {
    for (let value = 0; value <= MAX_ROLL; value += MINOR_STEP) {
      const major = value % MAJOR_STEP === 0;
      const angle = 90 - dir * value;
      const outer = polar(TICK_OUT, angle);
      const inner = polar(major ? TICK_IN_MAJOR : TICK_IN_MINOR, angle);

      marks.push(
        <Line
          key={`tick-${dir}-${value}`}
          x1={outer.x}
          y1={outer.y}
          x2={inner.x}
          y2={inner.y}
          stroke={major ? colors.text : colors.textMuted}
          strokeWidth={major ? MAJOR_TICK_WIDTH : MINOR_TICK_WIDTH}
        />,
      );

      // 0 fica só no ponteiro, uma vez; 180 fica só na parte de baixo, uma vez.
      if (!major || value === 0 || (value === MAX_ROLL && dir !== 1)) continue;

      const label = polar(LABEL_R, angle);
      marks.push(
        <SvgText
          key={`label-${dir}-${value}`}
          x={label.x}
          y={centeredBaseline(label.y, ROLL_LABEL_SIZE)}
          fill={colors.textMuted}
          fontSize={ROLL_LABEL_SIZE}
          fontWeight="700"
          textAnchor="middle"
        >
          {value}
        </SvgText>,
      );
    }
  }

  return <G>{marks}</G>;
}

function buildTrimRuler(): ReactNode {
  const spacingPerDegree = TRIM_TRAVEL / MAX_TRIM;
  const marks: ReactNode[] = [];

  for (let value = 0; value <= MAX_TRIM; value += MINOR_STEP) {
    const major = value % MAJOR_STEP === 0;
    const offset = value * spacingPerDegree;

    if (value === 0) {
      marks.push(
        <Line
          key="tick-0"
          x1={CX - 12}
          y1={CY}
          x2={CX + 12}
          y2={CY}
          stroke={colors.text}
          strokeWidth={MAJOR_TICK_WIDTH}
        />,
      );
      continue;
    }

    for (const y of [CY - offset, CY + offset]) {
      marks.push(
        <Line
          key={`tick-${value}-${y}`}
          x1={CX - 12}
          y1={y}
          x2={CX + 12}
          y2={y}
          stroke={major ? colors.text : colors.textMuted}
          strokeWidth={major ? MAJOR_TICK_WIDTH : MINOR_TICK_WIDTH}
        />,
      );
    }

    if (!major) continue;

    for (const y of [CY - offset, CY + offset]) {
      marks.push(
        <SvgText
          key={`label-${value}-${y}`}
          x={CX - 19}
          y={centeredBaseline(y, TRIM_LABEL_SIZE)}
          fill={colors.textMuted}
          fontSize={TRIM_LABEL_SIZE}
          fontWeight="700"
          textAnchor="end"
        >
          {value}
        </SvgText>,
      );
    }
  }

  return (
    <G>
      <Rect
        x={CX - STRIP_WIDTH / 2}
        y={CY - STRIP_HALF}
        width={STRIP_WIDTH}
        height={STRIP_HALF * 2}
        rx={radii.sm}
        fill={colors.bgElevated}
        stroke={colors.border}
        strokeWidth={1}
      />
      {marks}
    </G>
  );
}

const ROLL_SCALE = buildRollScale();
const TRIM_RULER = buildTrimRuler();

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

/** Ponto de cor da legenda — o canal que distingue trim de roll (`DESIGN.md` §1.3). */
export const DOT_TEST_ID = 'inclinometer-readout-dot';

export interface InclinometerProps {
  /** Diâmetro do mostrador em dp. O desenho escala a partir do viewBox 260×260. */
  size?: number;
  /**
   * Recebe a mensagem de erro do sensor, ou `null` quando não há erro.
   * A referência precisa ser estável (ex.: um `setState`), senão o efeito
   * abaixo re-roda a cada amostra.
   */
  onError?: (message: string | null) => void;
  /**
   * Torneira da gravação (`DESIGN.md` §7.1).
   *
   * O gravador entra por aqui, e não por um sensor próprio, para que a série
   * gravada seja a mesma que o usuário está vendo: mesmo filtro, mesma
   * calibração, mesmo `toAngles`. A referência precisa ser estável — a do
   * `useRecorder` é um `useCallback` — senão o `useInclination` re-instala a
   * torneira a cada amostra.
   *
   * Segue valendo que o `Inclinometer` é o **único** consumidor do hook e o
   * dono do `start`/`stop`: a tela passa a prop, não o estado.
   */
  onSample?: (angles: Angles, tMs: number) => void;
}

export function Inclinometer({ size = DEFAULT_SIZE, onError, onSample }: InclinometerProps) {
  const { roll, trim, error, start, stop } = useInclination({ onSample });

  // `Animated.Value` nativo precisa ser criado uma única vez: o construtor já
  // registra o nó no grafo animado nativo, e um por render vazaria um nó por
  // amostra. O inicializador de `useState` é o único que garante isso.
  const [angles] = useState(() => ({
    roll: new Animated.Value(0, { useNativeDriver: true }),
    trim: new Animated.Value(0, { useNativeDriver: true }),
  }));

  // Interpolações estáveis: são elas que fazem o `useMemo` das camadas abaixo
  // valer, porque o objeto de `transform` nunca muda de identidade.
  const rollRotation = useMemo(
    () =>
      angles.roll.interpolate({
        inputRange: [-MAX_ROLL, MAX_ROLL],
        outputRange: [`-${MAX_ROLL}deg`, `${MAX_ROLL}deg`],
        extrapolate: 'clamp',
      }),
    [angles],
  );
  const trimOffset = useMemo(
    () =>
      angles.trim.interpolate({
        inputRange: [-MAX_TRIM, MAX_TRIM],
        outputRange: [-TRIM_TRAVEL, TRIM_TRAVEL],
        extrapolate: 'clamp',
      }),
    [angles],
  );

  // Dono do sensor: o `Inclinometer` é o único consumidor do `useInclination`,
  // então quem segura o `start`/`stop` é ele — e só ele re-renderiza a 60 Hz.
  useEffect(() => {
    void start();
    return () => {
      stop();
    };
  }, [start, stop]);

  // Amostra → UI thread. Não passa por estado nem por prop: escreve direto no
  // grafo animado nativo.
  useEffect(() => {
    angles.roll.setValue(finiteOr(roll));
    angles.trim.setValue(finiteOr(trim));
  }, [angles, roll, trim]);

  useEffect(() => {
    onError?.(error);
  }, [error, onError]);

  const layers = useMemo(
    () => (
      <>
        {/* Nível 2 (fundo): a régua de trim, por baixo do anel — é o furo que a
            deixa aparecer. Desliza na vertical. */}
        <Animated.View
          testID="inclinometer-trim-ruler"
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { transform: [{ translateY: trimOffset }] }]}
        >
          <Svg style={StyleSheet.absoluteFill} viewBox={VIEW_BOX_PROP}>
            {TRIM_RULER}
          </Svg>
        </Animated.View>

        {/* O anel opaco: tapa a régua fora do furo e carrega as duas bordas e
            o índice tracejado fixo. Estático. */}
        <Svg style={StyleSheet.absoluteFill} viewBox={VIEW_BOX_PROP} pointerEvents="none">
          <Path d={ANNULUS_PATH} fill={colors.bgCard} fillRule="evenodd" />
          <Circle cx={CX} cy={CY} r={HOLE} fill="none" stroke={colors.border} strokeWidth={3} />
          <Circle cx={CX} cy={CY} r={R} fill="none" stroke={colors.border} strokeWidth={3} />
          <Line
            testID="inclinometer-trim-index"
            x1={CX - TRIM_INDEX_HALF_WIDTH}
            y1={CY}
            x2={CX + TRIM_INDEX_HALF_WIDTH}
            y2={CY}
            stroke={colors.border}
            strokeWidth={2}
            strokeDasharray="4 4"
          />
        </Svg>

        {/* Nível 1 (topo): a escala de roll, que gira com o anel. */}
        <Animated.View
          testID="inclinometer-roll-scale"
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { transform: [{ rotate: rollRotation }] }]}
        >
          <Svg style={StyleSheet.absoluteFill} viewBox={VIEW_BOX_PROP}>
            {ROLL_SCALE}
          </Svg>
        </Animated.View>

        {/* Ponteiro fixo no topo, acima de tudo: é ele que não gira. */}
        <Svg style={StyleSheet.absoluteFill} viewBox={VIEW_BOX_PROP} pointerEvents="none">
          <Path d={POINTER_PATH} fill={ROLL_COLOR} />
        </Svg>
      </>
    ),
    [rollRotation, trimOffset],
  );

  const rollText = formatAngle(roll);
  const trimText = formatAngle(trim);

  return (
    <View
      style={styles.root}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Inclinação. Trim ${trimText}, roll ${rollText}.`}
    >
      <View style={[styles.dial, { width: size, height: size }]}>{layers}</View>

      <View style={styles.legend} pointerEvents="none">
        <Readout color={TRIM_COLOR} name="TRIM" value={trimText} />
        <Readout color={ROLL_COLOR} name="ROLL" value={rollText} />
      </View>
    </View>
  );
}

/** `TRIM −4,1°` — nome do eixo e valor no mesmo nó de texto, para o leitor de
 *  tela ler a leitura inteira de uma vez. O canal de cor é o ponto ao lado. */
function Readout({ color, name, value }: { color: string; name: string; value: string }) {
  return (
    <View style={styles.readout}>
      <View testID={DOT_TEST_ID} style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.readoutText}>{`${name} ${value}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
  },
  dial: {
    position: 'relative',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s5,
    marginTop: spacing.s2,
  },
  readout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: radii.pill,
  },
  readoutText: {
    ...typography.heading,
    ...tabular,
    color: colors.text,
  },
});

export default Inclinometer;
