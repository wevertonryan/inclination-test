/** Divisor de 1px na cor de borda (`DESIGN.md` §6.1). */

import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '../../../style/app';

export interface DividerProps {
  style?: StyleProp<ViewStyle>;
  /** Margem vertical extra — some com a repetição de `marginTop` no chamador. */
  inset?: number;
}

export function Divider({ style, inset = 0 }: DividerProps) {
  return <View style={[styles.divider, inset > 0 && { marginVertical: inset }, style]} />;
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
});

export default Divider;