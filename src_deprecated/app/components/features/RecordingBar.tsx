/**
 * Barra de gravação (`DESIGN.md` §6.3, §7.3).
 *
 * ## Onde ela mora
 *
 * No `App.tsx`, irmã da `NavBar` que ela substitui — e pelo mesmo motivo da NavBar:
 * é uma peça de casca, não conteúdo de tela. Ficar dentro da `HomeScreen` a faria
 * respeitar o `paddingHorizontal` do `ScreenContainer`, e uma barra que não encosta
 * nas bordas não é uma barra.
 *
 * ## Por que ela se anima sozinha
 *
 * A `NavBar` some com `hidden`; se a `RecordingBar` apenas aparecesse e sumisse, os
 * dois módulos trocariam de lugar no mesmo quadro e o usuário veria um corte. Então
 * ela fica **sempre montada** e cuida do próprio unmount atrasado: só sai de cena
 * quando a animação de saída termina (§4 — nada some sem animação). Isso também
 * dispensa um estado `exiting` espalhado pelo `App`.
 *
 * ## O `gap: 44` do DESIGN.md
 *
 * §6.3 pede `gap 44` entre os três botões, mas §6.4 proíbe número solto de
 * espaçamento. O resultado visual é o mesmo com `space-between` e um padding
 * lateral: os botões vão para as pontas, e o do meio fica no centro por construção.
 *
 * ## `paddingBottom` é o inset, como na NavBar
 *
 * §7.3: a barra encosta no gesto do sistema. O `SafeAreaView` não é usado no lugar
 * porque aplicaria o inset nas duas bordas de uma vez.
 */

import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable } from 'react-native';
import { XStack, YStack } from '@tamagui/stacks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, X } from 'lucide-react-native';

import { colors, elevation, iconSize, layout, motion, onColor, radii, spacing } from '../../../style/app';
import type { RecordingMode } from '../../../core/types';
import RecordButton from './RecordButton';

const ICON_SIZE = iconSize.xl;

export interface RecordingBarProps {
  mode: RecordingMode;
  /** `false` dispara a animação de saída; o unmount é adiado para depois dela. */
  visible: boolean;
  onCancel: () => void;
  onToggle: () => void;
  onSave: () => void;
}

export function RecordingBar({ mode, visible, onCancel, onToggle, onSave }: RecordingBarProps) {
  const insets = useSafeAreaInsets();
  /** Mount atrasado: só entra em cena quando `visible` vira `true`. */
  const [mounted, setMounted] = useState(visible);
  /**
   * Colapsa a altura, como a `NavBar`. A versão anterior transladava
   * `translateY: navHeight` — mas a barra tem `navHeight + insets.bottom`, então
   * sobrava uma faixa embaixo e, pior, ela continuava ocupando layout em cima da
   * NavBar (que também não devolvia o lugar), com as duas sobrepostas no rodapé.
   * Animar a altura faz as duas ocuparem o mesmo slot, em sequência.
   *
   * `useNativeDriver: false` porque `height` não está no allowlist do módulo
   * animado nativo; transição única, não movimento a 60 Hz.
   */
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const barHeight = layout.navHeight + insets.bottom;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: motion.base.duration,
        easing: motion.base.easing,
        useNativeDriver: false,
      }).start();
      return;
    }

    Animated.timing(progress, {
      toValue: 0,
      duration: motion.exit.duration,
      easing: motion.exit.easing,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [progress, visible]);

  if (!mounted) return null;

  return (
    <Animated.View
      style={{
        height: progress.interpolate({ inputRange: [0, 1], outputRange: [0, barHeight] }),
        opacity: progress,
        overflow: 'hidden',
      }}
      pointerEvents={visible ? 'auto' : 'none'}
      testID="recording-bar"
    >
      <XStack
        alignItems="center"
        justifyContent="space-between"
        paddingHorizontal={spacing.s6}
        paddingBottom={insets.bottom}
        minHeight={layout.navHeight}
        backgroundColor="$color.bgElevated"
        borderTopWidth={1}
        borderTopColor="$color.border"
      >
        <SideButton
          label="Cancelar gravação"
          onPress={onCancel}
          tone="danger"
          Icon={X}
          testID="recording-bar-cancel"
        />

        <RecordButton mode={mode} onPress={onToggle} />

        <SideButton
          label="Salvar gravação"
          onPress={onSave}
          tone="ok"
          Icon={Check}
          testID="recording-bar-save"
        />
      </XStack>
    </Animated.View>
  );
}

interface SideButtonProps {
  label: string;
  onPress: () => void;
  tone: 'danger' | 'ok';
  Icon: typeof X;
  testID: string;
}

/**
 * Os botões das pontas (`DESIGN.md` §6.3): 60px, `elevation.2`, e o tom que
 * corresponde — `danger` no `X`, `ok` no `✓`.
 *
 * `Pressable` do RN e não `Button` do Tamagui pelo mesmo motivo da `NavBar`: o
 * alvo aqui é um botão com `accessibilityState`, e o realce de toque é
 * `opacity`, que não passa pela transformação que já deu problema uma vez.
 */
function SideButton({ label, onPress, tone, Icon, testID }: SideButtonProps) {
  const background = tone === 'danger' ? colors.danger : colors.ok;
  const foreground = tone === 'danger' ? onColor.danger : onColor.ok;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      // Area de toque maior que o desenho: 60px de círculo dentro de um alvo
      // quadrado, que é o que o dedo realmente acerta (§8).
      hitSlop={spacing.s2}
    >
      <YStack
        width={layout.sideRecordButtonSize}
        height={layout.sideRecordButtonSize}
        borderRadius={radii.pill}
        alignItems="center"
        justifyContent="center"
        backgroundColor={background}
        style={elevation[2]}
      >
        <Icon size={ICON_SIZE} color={foreground} strokeWidth={2} />
      </YStack>
    </Pressable>
  );
}

export default RecordingBar;