/**
 * Superfície padrão de conteúdo (`DESIGN.md` §6.2).
 *
 * `bgCard`, borda hairline, `radius.lg` e `elevation.1` — profundidade por
 * camadas de superfície, nunca por borda grossa.
 */

import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, elevation, radii, spacing } from '../../../style/app';

export interface CardProps {
  /** `padding 16` (escala §3.1). Desligado para cards que controlam o próprio padding. */
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

export function Card({ padded = true, style, children }: CardProps) {
  return <View style={[styles.card, padded && styles.padded, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation[1],
  },
  padded: {
    padding: spacing.s5,
  },
});

export default Card;