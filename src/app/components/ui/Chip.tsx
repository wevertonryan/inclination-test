/**
 * Chip de filtro/seleção (`DESIGN.md` §6.1).
 *
 * `radius.pill`, `bgCard` + borda. Ativo = `accentSoft` + borda `accent` +
 * texto `accent`.
 */

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import {
  colors,
  elevation,
  iconSize,
  radii,
  spacing,
  typography,
} from '../../../style/app';

export type ChipSize = 'sm' | 'md';

export interface ChipProps {
  label: string;
  active?: boolean;
  Icon?: LucideIcon;
  size?: ChipSize;
  disabled?: boolean;
  onPress?: () => void;
  testID?: string;
}

export function Chip({
  label,
  active = false,
  Icon,
  size = 'md',
  disabled = false,
  onPress,
  testID,
}: ChipProps) {
  const tint = active ? colors.accent : colors.textMuted;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active, disabled }}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' && styles.small,
        active ? styles.active : styles.inactive,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {Icon ? <Icon size={iconSize.sm} color={tint} strokeWidth={2} /> : null}
      <Text numberOfLines={1} style={[styles.label, { color: tint }]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Linha de chips — usada dentro de `FilterChips` e nos modais de filtro. */
export function ChipRow({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    paddingVertical: spacing.s3,
    paddingHorizontal: spacing.s4,
    borderRadius: radii.pill,
    borderWidth: 1,
    ...elevation[1],
  },
  small: {
    paddingVertical: spacing.s2,
    paddingHorizontal: spacing.s3,
    gap: spacing.s2,
  },
  inactive: {
    backgroundColor: colors.bgCard,
    borderColor: colors.border,
  },
  active: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    ...typography.label,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s3,
  },
});

export default Chip;