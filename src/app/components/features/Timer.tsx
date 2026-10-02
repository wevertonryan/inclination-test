/**
 * Cronômetro da gravação (`DESIGN.md` §6.3).
 *
 * Ocupa o lugar do `<ScreenHeader>` enquanto a gravação está em cena — o header
 * some com `hidden` e este pill fica no seu lugar, que é a mesma travessia que o
 * protótipo faz com `.overlay__timer`.
 *
 * ## O formato não é escolha de estilo
 *
 * `formatStopwatch` devolve `mm:ss · mmm` com `tabular-nums`. As três casas de
 * milissegundo parecem ruído, e não são: é o que prova que o relógio está vivo.
 * Sem elas o contador mudaria uma vez por segundo e pareceria um registro que
 * travou. E o `tabular` impede os dígitos de mudar de largura — um mostrador que
 * anda não pode pular na horizontal.
 *
 * ## Pausado não muda a cor
 *
 * O pill fica igual em `recording` e `paused`. Quem muda é o botão central da
 * `RecordingBar` (pausa ⇄ retomar) e o `accessibilityState` daqui. Alternar a cor
 * do cronômetro faria a animação de saída do header e a entrada deste pill brigarem
 * por atenção no mesmo quadro.
 *
 * ## Por que `Text` do RN dentro de um `YStack`
 *
 * É o mesmo caminho que o `Inclinometer` faz nas leituras `ROLL`/`TRIM`: a casca é
 * Tamagui, e o texto é RN porque precisa de `fontVariant: ['tabular-nums']`, que
 * é um `TextStyle` puro e não sobrevive como token de fonte do Tamagui.
 */

import { StyleSheet, Text } from 'react-native';
import { YStack } from '@tamagui/stacks';

import { colors, formatStopwatch, radii, spacing, tabular, typography } from '../../../style/app';

export interface TimerProps {
  /** Tempo ativo decorrido, sem pausas. `RecordingSessionState.elapsedMs`. */
  elapsedMs: number;
  paused?: boolean;
}

export function Timer({ elapsedMs, paused = false }: TimerProps) {
  const readout = formatStopwatch(elapsedMs);

  return (
    <YStack
      alignSelf="center"
      paddingVertical={spacing.s2}
      paddingHorizontal={spacing.s5}
      borderRadius={radii.pill}
      backgroundColor="$color.bgElevated"
      borderWidth={1}
      borderColor="$color.border"
      accessibilityRole="timer"
      accessibilityLabel={paused ? `Gravação pausada, ${readout}` : `Gravando, ${readout}`}
      testID="recording-timer"
    >
      <Text style={[styles.readout, { color: paused ? colors.textMuted : colors.accent }]}>
        {readout}
      </Text>
    </YStack>
  );
}

const styles = StyleSheet.create({
  readout: {
    ...typography.display,
    ...tabular,
  },
});

export default Timer;