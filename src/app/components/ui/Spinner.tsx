/**
 * Spinner de rotação contínua (`DESIGN.md` §4).
 *
 * `Animated.loop` com `motion.slow` por volta, sem pausa entre ciclos — o mesmo
 * desenho do `@keyframes spinner` do protótipo. Fica aqui porque três
 * componentes precisam dele (`Button`, `StatusDot`, `Toast`) e a rotação não
 * pertence a nenhum deles.
 */

import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { LoaderCircle } from 'lucide-react-native';

import { colors, motion } from '../../../style/app';

export interface SpinnerProps {
  size: number;
  color?: string;
}

export function Spinner({ size, color = colors.accent }: SpinnerProps) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: motion.slow.duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ rotate }] }]}>
      <LoaderCircle size={size} color={color} strokeWidth={2} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Spinner;