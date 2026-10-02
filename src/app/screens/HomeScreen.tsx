/**
 * Home — Medição (`DESIGN.md` §7.1, `PROTOTIPO.md`).
 *
 * O inclinômetro é o **único** consumidor do `useInclination` e o dono do
 * `start`/`stop` do sensor. Isso é deliberado: se a tela também usasse o hook,
 * haveria dois sensores e dois filtros vivos ao mesmo tempo, e a tela inteira
 * re-renderizaria a 60 Hz. Aqui a tela só re-renderiza quando o erro muda.
 *
 * ## Por que a gravação não vira um sensor
 *
 * A gravação entra pela prop `onSample` do `Inclinometer`, não por um segundo
 * `useInclination`. A série gravada tem que ser a mesma que o usuário viu — mesmo
 * filtro, mesma calibração, mesmo `toAngles` — e um sensor próprio gravaria outra
 * coisa. A tela continua sem pedir leitura nenhuma, que é o que
 * `HomeScreen.test.tsx` trava.
 *
 * ## O que aparece em cada estado
 *
 * `idle`: header, mostrador, botão de gravar no rodapé.
 * `recording`/`paused`: o header some e o cronômetro assume o lugar dele; o
 * gráfico da janela recente aparece; a `NavBar` some e a `RecordingBar` entra no
 * lugar dela (isso mora no `App.tsx`).
 *
 * O botão de gravar fica sempre montado e some com o mesmo movimento do header,
 * para os dois não brigarem no mesmo quadro.
 */

import { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { YStack } from '@tamagui/stacks';
import { Button } from '@tamagui/button';

import { useRecording } from '../../core/recording/RecordingProvider';
import { colors, formatShortDate, layout, onColor, radii, spacing, typography } from '../../style/app';
import ScreenContainer from '../components/layout/ScreenContainer';
import ScreenHeader from '../components/layout/ScreenHeader';
import Inclinometer from '../components/features/Inclinometer';
import { LineChart, type ChartSeries } from '../components/features/LineChart';
import RecordButton from '../components/features/RecordButton';
import Timer from '../components/features/Timer';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';

/** Cor e nome de cada eixo. O canal é o mesmo do mostrador: âmbar = roll. */
const ROLL: ChartSeries['color'] = colors.roll;
const TRIM: ChartSeries['color'] = colors.trim;

export default function HomeScreen() {
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');

  const recording = useRecording();
  const { mode, elapsedMs, samples, error: recordingError, request, dismissRequest } = recording;

  const immersive = mode !== 'idle';
  const paused = mode === 'paused';

  /**
   * Memoizado porque `LineChart` mede os pontos a partir dos **números**, e um
   * array novo a cada render faria essa medição recomeçar junto. Também evita
   * remontar a série quando o que mudou foi o erro ou o título do diálogo — o
   * gráfico não tem por que se redesenhar por causa de uma caixa de texto.
   */
  const series = useMemo<ChartSeries[]>(
    () => [
      { values: samples.map((sample) => sample.roll), color: ROLL, name: 'Roll' },
      { values: samples.map((sample) => sample.trim), color: TRIM, name: 'Trim' },
    ],
    [samples]
  );

  /** Sem nome digitado, o relatório se chama pela data — nunca fica vazio. */
  const handleSave = async (): Promise<void> => {
    await recording.confirmSave(title.trim() || `Medição ${formatShortDate(new Date())}`);
    setTitle('');
  };

  return (
    /* Parado, o mostrador é a tela inteira e não há o que rolar. Gravando, a
       tela passa a ter mostrador + cronômetro + gráfico, e num aparelho baixo
       isso não cabe: com `scroll={false}` o gráfico era simplesmente cortado.
       Rolar aqui não custa nada — o `LineChart` mede a largura pelo `onLayout`. */
    <ScreenContainer scroll={immersive}>
      <ScreenHeader title="Medição" hidden={immersive} />

      {immersive ? (
        <Timer elapsedMs={elapsedMs} paused={paused} />
      ) : null}

      {/* Sem card nem moldura: o mostrador é solto sobre o fundo da tela. */}
      <Inclinometer onError={setError} onSample={recording.captureAngle} />

      {immersive ? (
        <YStack
          padding={spacing.s5}
          borderRadius={radii.lg}
          borderWidth={1}
          borderColor="$color.border"
          backgroundColor="$color.bgCard"
          gap={spacing.s3}
        >
          <Text style={styles.cardTitle}>Trim × Roll</Text>
          <LineChart series={series} />
        </YStack>
      ) : null}

      {error !== null && (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}

      {recordingError !== null ? (
        <Text style={styles.error} accessibilityLiveRegion="polite" testID="recording-error">
          {recordingError}
        </Text>
      ) : null}

      {!immersive ? (
        <YStack
          alignItems="center"
          paddingTop={spacing.s5}
          flex={1}
          justifyContent="flex-end"
          paddingBottom={spacing.s5}
        >
          <RecordButton mode={mode} onPress={() => void recording.start()} />
        </YStack>
      ) : null}

      {/* ---------------------------------------------------------- diálogos */}

      <Modal
        visible={request === 'cancel'}
        onClose={dismissRequest}
        title="Cancelar gravação?"
        description="Os dados registrados serão perdidos para sempre."
        testID="cancel-modal"
      >
        <YStack gap={spacing.s3}>
          <DialogButton label="Voltar" tone="ghost" onPress={dismissRequest} />
          <DialogButton
            label="Cancelar gravação"
            tone="danger"
            onPress={() => void recording.confirmCancel()}
          />
        </YStack>
      </Modal>

      <Modal
        visible={request === 'save'}
        onClose={dismissRequest}
        title="Salvar gravação"
        testID="save-modal"
      >
        <YStack gap={spacing.s4}>
          <Input
            label="Nome da gravação"
            placeholder="Nome da gravação"
            value={title}
            onChangeText={setTitle}
            onSubmit={() => void handleSave()}
            testID="save-title"
          />

          <YStack gap={spacing.s3}>
            <DialogButton label="Voltar" tone="ghost" onPress={dismissRequest} />
            <DialogButton label="Salvar" tone="primary" onPress={() => void handleSave()} />
          </YStack>
        </YStack>
      </Modal>
    </ScreenContainer>
  );
}

/**
 * Botão dos diálogos. `Button` do Tamagui direto (`DESIGN.md` §7.6: onde a
 * primitiva serve, ela é a primitiva), com a identidade em `style` — o
 * `defaultVariant` dele nasce em `bg`, que é o fundo da tela.
 */
function DialogButton({
  label,
  tone,
  onPress,
}: {
  label: string;
  tone: 'primary' | 'ghost' | 'danger';
  onPress: () => void;
}) {
  const background =
    tone === 'primary' ? colors.accent : tone === 'danger' ? colors.danger : colors.bgCard;
  const foreground =
    tone === 'primary' ? onColor.accent : tone === 'danger' ? onColor.danger : colors.text;

  return (
    <Button
      onPress={onPress}
      minHeight={layout.touchTarget}
      borderRadius={radii.md}
      backgroundColor={background}
      borderWidth={tone === 'ghost' ? 1 : 0}
      borderColor={colors.border}
      paddingHorizontal={spacing.s4}
      pressStyle={{ opacity: 0.86 }}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={`dialog-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <Text style={[styles.dialogLabel, { color: foreground }]}>{label}</Text>
    </Button>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    ...typography.label,
    color: colors.textMuted,
  },
  error: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
  },
  dialogLabel: {
    ...typography.label,
  },
});