/**
 * Modal (`DESIGN.md` §6.1, §7.6).
 *
 * Card `bgElevated` + borda, `radius.lg`, largura máx 340, `padding 20`.
 * Entrada `motion.base`, saída `motion.exit` — nada some sem animação de saída
 * (§4), então o componente continua montado durante a saída.
 *
 * `backdrop={false}` = card flutuante sem escurecer a tela (modal de status do
 * sensor no protótipo).
 *
 * ## Por que `Modal` do RN e não `Dialog` do Tamagui
 *
 * §7.6 manda a casca migrar para o Tamagui, mas este é o caso que ele mesmo
 * nomeia como exceção: o `Dialog` do Tamagui puxa o `Popper`, que depende de
 * `react-dom`. Num app Android-only isso é um caminho de web inteiro dentro do
 * app. O `Modal` nativo do RN faz a mesma coisa sem a dependência, e a entrada e a
 * saída continuam em `Animated` com `useNativeDriver`.
 *
 * A casca é `Animated.View` + `StyleSheet` (não `YStack`), porque a sombra de
 * `elevation[3]` e o `scale` do card são transformações de RN puro — é a mesma
 * razão que tirou o `ui/PressableScale.tsx` da equação.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Modal as RNModal, Pressable, StyleSheet, Text } from 'react-native';

import {
  colors,
  elevation,
  motion,
  radii,
  spacing,
  typography,
} from '../../../style/app';

export interface ModalProps {
  visible: boolean;
  backdrop?: boolean;
  /** Tocar fora fecha. `true` só faz sentido com `backdrop`. */
  dismissible?: boolean;
  onClose?: () => void;
  title?: string;
  /** Linha de apoio sob o título. */
  description?: string;
  children?: ReactNode;
  testID?: string;
}

export function Modal({
  visible,
  backdrop = true,
  dismissible = true,
  onClose,
  title,
  description,
  children,
  testID,
}: ModalProps) {
  /** Mount atrasado: só entra em cena quando `visible` vira `true`. */
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: motion.base.duration,
        easing: motion.base.easing,
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(progress, {
      toValue: 0,
      duration: motion.exit.duration,
      easing: motion.exit.easing,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [progress, visible]);

  if (!mounted) return null;

  return (
    <RNModal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismissible ? onClose : undefined}
      testID={testID}
    >
      <Animated.View
        style={[
          styles.overlay,
          backdrop && { backgroundColor: colors.overlay },
          { opacity: progress },
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          disabled={!dismissible || !backdrop}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.card,
            {
              opacity: progress,
              transform: [
                {
                  scale: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.94, 1],
                  }),
                },
              ],
            },
          ]}
        >
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {description ? <Text style={styles.description}>{description}</Text> : null}
          {children}
        </Animated.View>
      </Animated.View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.s6,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    padding: spacing.s6,
    gap: spacing.s4,
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation[3],
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  description: {
    ...typography.body,
    color: colors.textMuted,
  },
});

export default Modal;