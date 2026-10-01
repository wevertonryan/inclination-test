/**
 * Toast (`DESIGN.md` §6.1).
 *
 * Fila acima da NavBar, `radius.md`, some sozinho após 2s com `motion.exit`.
 * Altura da NavBar em `bottom` para nunca ficar atrás da barra.
 */

import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Check, Info, TriangleAlert, type LucideIcon } from 'lucide-react-native';

import {
  colors,
  elevation,
  iconSize,
  layout,
  motion,
  radii,
  spacing,
  typography,
} from '../../../style/app';

export type ToastTone = 'ok' | 'neutral' | 'danger';

export interface ToastProps {
  message: string;
  tone?: ToastTone;
  /** Some sozinho após 2s; `false` deixa o controle com a tela. */
  autoHide?: boolean;
  /** Quanto tempo fica visível antes da saída. */
  durationMs?: number;
}

const TONE: Record<
  ToastTone,
  { background: string; tint: string; Icon: LucideIcon }
> = {
  ok: { background: colors.ok, tint: '#05150D', Icon: Check },
  neutral: { background: colors.bgCard, tint: colors.text, Icon: Info },
  danger: { background: colors.danger, tint: '#FFFFFF', Icon: TriangleAlert },
};

export function Toast({
  message,
  tone = 'neutral',
  autoHide = true,
  durationMs = 2000,
}: ToastProps) {
  const palette = TONE[tone];
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: motion.base.duration,
      easing: motion.base.easing,
      useNativeDriver: true,
    }).start();

    if (!autoHide) return;

    const hide = setTimeout(() => {
      Animated.timing(progress, {
        toValue: 0,
        duration: motion.exit.duration,
        easing: motion.exit.easing,
        useNativeDriver: true,
      }).start();
    }, durationMs);

    return () => clearTimeout(hide);
  }, [autoHide, durationMs, progress]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        {
          backgroundColor: palette.background,
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [spacing.s4, 0],
              }),
            },
          ],
        },
      ]}
    >
      <palette.Icon size={iconSize.md} color={palette.tint} strokeWidth={2} />
      <Text numberOfLines={2} style={[styles.message, { color: palette.tint }]}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    marginHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing.s4,
    paddingHorizontal: spacing.s5,
    borderRadius: radii.md,
    ...elevation[2],
  },
  message: {
    ...typography.label,
    flexShrink: 1,
  },
});

export default Toast;