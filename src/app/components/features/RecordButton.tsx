/**
 * Botão de gravação (`DESIGN.md` §6.3).
 *
 * ## Três estados, três sinais
 *
 * `idle` é um núcleo branco, `recording` é pausa, `paused` é retomar. Cada estado
 * tem **forma** própria e não só cor: quem não distingue o âmbar do vermelho vê
 * a diferença do mesmo jeito (§8 proíbe cor como sinal isolado).
 *
 * ## Por que não há SVG aqui
 *
 * O `Inclinometer` e o `LineChart` são SVG porque desenham. Este botão desenha um
 * círculo e mostra um ícone que o Lucide já tem — não há geometria que o Tamagui
 * não resolva mais simples, e `DESIGN.md` §7.6 manda um componente novo nascer
 * Tamagui.
 *
 * ## Por que o toque escurece em vez de encolher
 *
 * O `ui/PressableScale.tsx` que existia antes da migração fazia `scale: 0.94` num
 * `Animated.createAnimatedComponent(Pressable)`, e a própria docstring dele
 * registrava o motivo: `Pressable` puro quebrava com *"Transform with key of
 * 'scale' must be a number"*. `opacity` não passa por transform, então não
 * reintroduz o bug — e um botão de 68px escurecendo lê melhor sob o dedo do que
 * encolhendo.
 */

import { Button } from '@tamagui/button';
import { YStack } from '@tamagui/stacks';
import { styled } from '@tamagui/web';
import { Pause, Play } from 'lucide-react-native';

import { colors, elevation, layout, onColor } from '../../../style/app';
import type { RecordingMode } from '../../../core/types';

/** O núcleo branco do estado `idle` (`DESIGN.md` §6.3). */
const CORE_SIZE = 30;

/** 26 no protótipo — um pouco menor que `iconSize.xxl`, que é 28. */
const ICON_SIZE = 26;

const LABELS: Record<RecordingMode, string> = {
  idle: 'Gravar registro',
  recording: 'Pausar gravação',
  paused: 'Retomar gravação',
};

const Circle = styled(Button, {
  name: 'RecordButton',

  width: layout.recordButtonSize,
  height: layout.recordButtonSize,
  padding: 0,
  borderRadius: layout.recordButtonSize / 2,
  backgroundColor: '$color.rec',
  borderWidth: 0,
  borderColor: 'transparent',

  // A elevation é RN puro (shadowColor/Offset/Opacity/Radius), então vai pela
  // fachada e não por `$elevation` — que o Tamagui não define.
  ...elevation[2],

  pressStyle: { opacity: 0.82 },
  focusStyle: { opacity: 0.9 },
});

export interface RecordButtonProps {
  mode: RecordingMode;
  onPress: () => void;
  /** Desliga o toque — usado enquanto o banco abre na hora de gravar. */
  disabled?: boolean;
}

export function RecordButton({ mode, onPress, disabled = false }: RecordButtonProps) {
  return (
    <Circle
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={LABELS[mode]}
      // `busy` é o que faz a leitor de tela anunciar "gravando" — o mesmo
      // cuidado que §8 exige de cor.
      accessibilityState={{ disabled, busy: mode === 'recording' }}
      testID="record-button"
    >
      {mode === 'idle' ? (
        <YStack
          width={CORE_SIZE}
          height={CORE_SIZE}
          borderRadius={CORE_SIZE / 2}
          // Não há token branco puro no tema: quem mora sobre o vermelho de
          // gravação é `onColor.rec`, que é o par declarado em §5.
          backgroundColor={onColor.rec}
          // `inset 0 2px 4px rgba(0,0,0,.18)` no protótipo: o relevo que faz
          // o núcleo parecer pressionado dentro do botão, não colado nele.
          shadowColor={colors.shadow}
          shadowOpacity={0.18}
          shadowRadius={4}
          shadowOffset={{ width: 0, height: 2 }}
        />
      ) : mode === 'recording' ? (
        <Pause size={ICON_SIZE} color={onColor.rec} strokeWidth={2} />
      ) : (
        <Play size={ICON_SIZE} color={onColor.rec} strokeWidth={2} />
      )}
    </Circle>
  );
}

export default RecordButton;