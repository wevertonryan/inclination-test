/**
 * Botão genérico (`DESIGN.md` §6.1).
 *
 * Sem vocabulário de domínio: `roll`, `sensor`, `report`… não entram aqui.
 * Alturas `sm 32 · md 44 · lg 52`, `radius.md`, `gap 4` entre ícone e texto.
 */

import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import {
  colors,
  iconSize,
  onColor,
  radii,
  spacing,
  tabular,
  typography,
} from '../../../style/app';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label?: string;
  /** Ícone opcional à esquerda do rótulo (Lucide). */
  icon?: LucideIcon;
  loading?: boolean;
  /** `true` quando o rótulo é um número — força a regra tabular (§2.2). */
  tabularText?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children?: ReactNode;
}

const HEIGHTS: Record<ButtonSize, number> = { sm: 32, md: 44, lg: 52 };

const CONTAINER: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: colors.accent, borderColor: colors.accent },
  ghost: { backgroundColor: colors.bgCard, borderColor: colors.border },
  danger: { backgroundColor: colors.danger, borderColor: colors.danger },
};

const LABEL_COLOR: Record<ButtonVariant, string> = {
  primary: onColor.accent,
  ghost: colors.text,
  danger: onColor.danger,
};

export function Button({
  variant = 'primary',
  size = 'md',
  label,
  icon: Icon,
  loading = false,
  tabularText = false,
  fullWidth = false,
  disabled = false,
  style,
  textStyle,
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const tint = LABEL_COLOR[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.container,
        { height: HEIGHTS[size] },
        CONTAINER[variant],
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <Spinner size={iconSize.md} color={tint} />
      ) : Icon ? (
        <Icon size={iconSize.md} color={tint} strokeWidth={2} />
      ) : null}

      {label !== undefined && (
        <Text
          numberOfLines={1}
          style={[
            styles.label,
            size === 'sm' && typography.caption,
            { color: tint },
            tabularText && tabular,
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
      {children}
    </Pressable>
  );
}

/** Fileira de botões com o gap da escala — usada nos modais e formulários. */
export function ButtonRow({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    gap: spacing.s2,
    paddingHorizontal: spacing.s4,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  pressed: {
    backgroundColor: colors.accentStrong,
    borderColor: colors.accentStrong,
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

export default Button;