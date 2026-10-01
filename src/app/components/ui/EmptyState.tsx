/**
 * Estado vazio (`DESIGN.md` §6.1).
 *
 * Centralizado, ícone 40px `textFaint`, título `label`, descrição `body`
 * `textMuted`. Usado quando não há relatórios ou o filtro não devolve nada.
 */

import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { colors, iconSize, spacing, typography } from '../../../style/app';

export interface EmptyStateProps {
  title: string;
  description?: string;
  Icon?: LucideIcon;
  action?: ReactNode;
}

export function EmptyState({ title, description, Icon, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {Icon ? <Icon size={iconSize.hero} color={colors.textFaint} strokeWidth={1.5} /> : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.s8,
    paddingHorizontal: spacing.s5,
    gap: spacing.s4,
  },
  title: {
    ...typography.label,
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default EmptyState;