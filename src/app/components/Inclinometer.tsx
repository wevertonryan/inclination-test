import type { ReactElement } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, inclinometerStyles } from '../../style/app';

const CX = 130;
const CY = 130;
const R = 112;
const HOLE = 62;
const TICK_OUT = 106;
const TICK_IN_MAJOR = 96;
const TICK_IN_MINOR = 101;
const LABEL_R = 78;
const STRIP_W = 46;
const STRIP_HALF = 76;
const RULER_MOVE = 52;
const SVG_SIZE = 260;
const MAX_WIDTH = 340;
const HORIZONTAL_PADDING = 28;

const ANNULUS =
  `M ${CX} ${CY - R} A ${R} ${R} 0 1 1 ${CX} ${CY + R} A ${R} ${R} 0 1 1 ${CX} ${CY - R} Z ` +
  `M ${CX} ${CY - HOLE} A ${HOLE} ${HOLE} 0 1 0 ${CX} ${CY + HOLE} A ${HOLE} ${HOLE} 0 1 0 ${CX} ${CY - HOLE} Z`;

export interface InclinometerProps {
  roll: number;
  trim: number;
  testID?: string;
}

function formatDeg(value: number): string {
  return `${value.toFixed(1).replace('.', ',')}°`;
}

function polar(r: number, angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CX + r * Math.cos(rad),
    y: CY - r * Math.sin(rad),
  };
}

function buildRollTicks(): ReactElement[] {
  const marks: ReactElement[] = [];
  const sides = [1, -1];
  for (const dir of sides) {
    for (let v = 0; v <= 180; v += 10) {
      const major = v % 30 === 0;
      const ang = 90 - dir * v;
      const out = polar(TICK_OUT, ang);
      const inner = polar(major ? TICK_IN_MAJOR : TICK_IN_MINOR, ang);
      marks.push(
        <G key={`${dir}-${v}`}>
          <Line
            x1={out.x}
            y1={out.y}
            x2={inner.x}
            y2={inner.y}
            stroke={major ? colors.text : colors.textMuted}
            strokeWidth={major ? 2 : 1.5}
          />
          {major && v !== 0 && (v !== 180 || dir === 1) && (
            <SvgText
              x={polar(LABEL_R, ang).x}
              y={polar(LABEL_R, ang).y}
              fill={colors.textMuted}
              fontSize={14}
              fontWeight="700"
              textAnchor="middle"
              alignmentBaseline="central"
            >
              {v}
            </SvgText>
          )}
        </G>,
      );
    }
  }
  return marks;
}

function buildRulerSlides(): ReactElement[] {
  const ticks: ReactElement[] = [];
  const spacing = RULER_MOVE / 90;
  for (let v = 0; v <= 90; v += 10) {
    const major = v % 30 === 0;
    const off = v * spacing;
    const yTop = CY - off;
    const yBot = CY + off;
    const stroke = major ? colors.text : colors.textMuted;

    if (v === 0) {
      ticks.push(
        <G key="0">
          <Line
            x1={CX - 12}
            y1={CY}
            x2={CX + 12}
            y2={CY}
            stroke={stroke}
            strokeWidth={2}
          />
        </G>,
      );
    } else {
      ticks.push(
        <G key={v}>
          <Line x1={CX - 12} y1={yTop} x2={CX + 12} y2={yTop} stroke={stroke} strokeWidth={major ? 2 : 1.5} />
          <Line x1={CX - 12} y1={yBot} x2={CX + 12} y2={yBot} stroke={stroke} strokeWidth={major ? 2 : 1.5} />
          {major && (
            <SvgText
              x={CX - 19}
              y={yTop}
              fill={colors.textMuted}
              fontSize={12}
              fontWeight="700"
              textAnchor="end"
              alignmentBaseline="central"
            >
              {v}
            </SvgText>
          )}
          {major && (
            <SvgText
              x={CX - 19}
              y={yBot}
              fill={colors.textMuted}
              fontSize={12}
              fontWeight="700"
              textAnchor="end"
              alignmentBaseline="central"
            >
              {v}
            </SvgText>
          )}
        </G>,
      );
    }
  }
  return ticks;
}

const ROLL_TICKS = buildRollTicks();
const RULER_SLIDES = buildRulerSlides();

export default function Inclinometer({ roll, trim, testID }: InclinometerProps) {
  const { width } = useWindowDimensions();
  const size = Math.min(width - HORIZONTAL_PADDING, MAX_WIDTH);
  const trimPx = (trim / 90) * RULER_MOVE;

  return (
    <View style={inclinometerStyles.container} testID={testID}>
      <Svg width={size} height={size} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}>
        <Circle cx={CX} cy={CY} r={R} fill={colors.bg} />

        {/* trim COM sinal: a régua desliza para cima (proa baixa) ou para baixo (proa alta) */}
        <G transform={`translate(0, ${trimPx})`}>
          <Rect
            x={CX - STRIP_W / 2}
            y={CY - STRIP_HALF}
            width={STRIP_W}
            height={STRIP_HALF * 2}
            rx={8}
            fill={colors.bgElevated}
            stroke={colors.border}
            strokeWidth={1}
          />
          {RULER_SLIDES}
        </G>

        <Path d={ANNULUS} fillRule="evenodd" fill={colors.bgCard} />
        <Circle cx={CX} cy={CY} r={HOLE} fill="none" stroke={colors.border} strokeWidth={3} />
        <Circle cx={CX} cy={CY} r={R} fill="none" stroke={colors.border} strokeWidth={3} />

        {/* roll COM sinal: o anel gira para qualquer um dos dois lados */}
        <G transform={`rotate(${roll}, ${CX}, ${CY})`}>
          {ROLL_TICKS}
        </G>

        <Line
          x1={CX - HOLE + 8}
          y1={CY}
          x2={CX + HOLE - 8}
          y2={CY}
          stroke={colors.border}
          strokeWidth={2}
          strokeDasharray="4 4"
        />
        <Path
          d={`M ${CX - 9} ${CY - R - 4} L ${CX + 9} ${CY - R - 4} L ${CX} ${CY - R + 16} Z`}
          fill="rgba(0, 0, 0, 0.28)"
          transform="translate(0, 2)"
        />
        <Path
          d={`M ${CX - 9} ${CY - R - 4} L ${CX + 9} ${CY - R - 4} L ${CX} ${CY - R + 16} Z`}
          fill={colors.accent}
        />
      </Svg>

      <View style={inclinometerStyles.legend}>
        <View style={inclinometerStyles.item}>
          <View style={[inclinometerStyles.dot, { backgroundColor: colors.trim }]} />
          <Text style={inclinometerStyles.itemText}>TRIM {formatDeg(trim)}</Text>
        </View>
        <View style={inclinometerStyles.item}>
          <View style={[inclinometerStyles.dot, { backgroundColor: colors.roll }]} />
          <Text style={inclinometerStyles.itemText}>ROLL {formatDeg(roll)}</Text>
        </View>
      </View>
    </View>
  );
}
