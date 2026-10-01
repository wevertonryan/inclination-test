/**
 * Campo de texto (`DESIGN.md` §6.1).
 *
 * `bgInput` — mais fundo que o card, para parecer cavado. Focado vira borda
 * `accent`; com erro, borda `danger` + mensagem em `danger`.
 */

import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import {
  colors,
  iconSize,
  radii,
  spacing,
  typography,
} from '../../../style/app';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  placeholder?: string;
  /** Ícone dentro do campo, à esquerda. */
  Icon?: LucideIcon;
  /** Borda e mensagem em `danger`. */
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  /** `true` só no campo que aceita número (§8). */
  numeric?: boolean;
}

export function Input({
  label,
  placeholder,
  Icon,
  error,
  containerStyle,
  numeric = false,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const hasError = error !== undefined && error !== '';

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.field,
          focused && !hasError && styles.focused,
          hasError && styles.errorField,
        ]}
      >
        {Icon ? (
          <Icon
            size={iconSize.md}
            color={hasError ? colors.danger : colors.textMuted}
            strokeWidth={2}
          />
        ) : null}
        <TextInput
          {...rest}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          keyboardType={numeric ? 'numeric' : rest.keyboardType ?? 'default'}
          onFocus={(event) => {
            setFocused(true);
            rest.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            rest.onBlur?.(event);
          }}
          style={styles.input}
        />
      </View>

      {hasError ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.s2,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    paddingVertical: spacing.s4,
    paddingHorizontal: spacing.s4,
    backgroundColor: colors.bgInput,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  focused: {
    borderColor: colors.accent,
  },
  errorField: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    padding: 0,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
});

export default Input;