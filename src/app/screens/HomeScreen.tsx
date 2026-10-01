/**
 * Home — Medição (`DESIGN.md` §7.1, `PROTOTIPO.md`).
 *
 * O inclinômetro é o **único** consumidor do `useInclination` e o dono do
 * `start`/`stop` do sensor. Isso é deliberado: se a tela também usasse o hook,
 * haveria dois sensores e dois filtros vivos ao mesmo tempo, e a tela inteira
 * re-renderizaria a 60 Hz. Aqui a tela só re-renderiza quando o erro muda.
 */

import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors, typography } from '../../style/app';
import ScreenContainer from '../components/layout/ScreenContainer';
import ScreenHeader from '../components/layout/ScreenHeader';
import Inclinometer from '../components/features/Inclinometer';

export default function HomeScreen() {
  const [error, setError] = useState<string | null>(null);

  return (
    <ScreenContainer scroll={false}>
      <ScreenHeader title="Medição" />

      {/* Sem card nem moldura: o mostrador é solto sobre o fundo da tela. */}
      <Inclinometer onError={setError} />

      {error !== null && (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  error: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
  },
});
