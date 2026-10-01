/**
 * `Pressable` com `scale` no estado pressionado (`DESIGN.md` §4).
 *
 * O botão redondo do app responde a `pressed` com `scale 0.94` e **sem**
 * transição de cor: o feedback tem que ser imediato, não uma fade. IconButton,
 * RecordButton e RecordingBar compartilham este comportamento em vez de
 * reimplementarem o `Animated.Value` cada um.
 */

import { useRef, type ReactNode } from 'react';
import {
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { motion } from '../../../style/app';

export const PRESSED_SCALE = 0.94;

/**
 * `Pressable` só não basta: um `AnimatedValue` dentro de `style` de um
 * componente comum chega cru no `processTransform` do RN, que exige número e
 * estoura `Invariant Violation: Transform with key of "scale" must be a number`.
 * É o `createAnimatedComponent` que registra o nó no driver nativo.
 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

export function PressableScale({
  scaleTo = PRESSED_SCALE,
  style,
  children,
  ...rest
}: PressableScaleProps) {
  const press = useRef(new Animated.Value(0)).current;

  const scale = press.interpolate({
    inputRange: [0, 1],
    outputRange: [1, scaleTo],
  });

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(event) => {
        Animated.timing(press, {
          toValue: 1,
          duration: motion.fast.duration,
          useNativeDriver: true,
        }).start();
        rest.onPressIn?.(event);
      }}
      onPressOut={(event) => {
        Animated.timing(press, {
          toValue: 0,
          duration: motion.fast.duration,
          useNativeDriver: true,
        }).start();
        rest.onPressOut?.(event);
      }}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}

export default PressableScale;