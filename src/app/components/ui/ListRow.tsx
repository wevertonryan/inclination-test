/**
 * Linha de lista (`DESIGN.md` §6.1).
 *
 * Sem card próprio: `padding 12/16`, `gap 12`, divisor `border` entre linhas.
 * `right` fica alinhado à direita e nunca rouba a largura do título.
 */

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { colors, iconSize, radii, spacing, typography } from '../../../style/app';
import { Divider } from './Divider';

export interface ListRowProps {
  Icon?: LucideIcon;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
  /** Some com o divisor acima da primeira linha de uma lista. */
  first?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

export function ListRow({
  Icon,
  title,
  subtitle,
  right,
  onPress,
  first = false,
  accessibilityLabel,
  testID,
}: ListRowProps) {
  const content = (
    <>
      {Icon ? <Icon size={iconSize.md} color={colors.textMuted} strokeWidth={2} /> : null}
      <View style={styles.text}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </>
  );

  return (
    <View>
      {!first ? <Divider /> : null}
      {onPress ? (
        <Pressable
          onPress={onPress}
          testID={testID}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? title}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          {content}
        </Pressable>
      ) : (
        <View style={styles.row} testID={testID} accessible accessibilityLabel={accessibilityLabel}>
          {content}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s4,
    minHeight: 56,
    paddingVertical: spacing.s4,
    paddingHorizontal: spacing.s4,
    borderRadius: radii.sm,
  },
  pressed: {
    backgroundColor: colors.bgElevated,
  },
  text: {
    flex: 1,
    gap: spacing.s1,
    minWidth: 0,
  },
  title: {
    ...typography.label,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
  },
  right: {
    alignItems: 'flex-end',
    gap: spacing.s1,
  },
});

export default ListRow;