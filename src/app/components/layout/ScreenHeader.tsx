/**
 * Header da própria Screen (`DESIGN.md` §6.2).
 *
 * Três slots: `left` · `title` centralizado · `right`. Cada tela tem título e
 * slots próprios, então o header mora na Screen, não no shell — e rola junto
 * com o conteúdo. `hidden` o desliza para cima com `motion.slow`, usado na
 * gravação imersiva, quando o cronômetro ocupa aquele lugar.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { colors, layout, motion, spacing, typography } from '../../../style/app';

export interface ScreenHeaderProps {
  title: string;
  left?: ReactNode;
  right?: ReactNode;
  /** Some deslizando para cima — gravação imersiva. */
  hidden?: boolean;
}

export function ScreenHeader({
  title,
  left,
  right,
  hidden = false,
}: ScreenHeaderProps) {
  const [height, setHeight] = useState<number>(layout.headerMinHeight);
  const offset = useRef(new Animated.Value(hidden ? -layout.headerMinHeight : 0)).current;

  useEffect(() => {
    Animated.timing(offset, {
      toValue: hidden ? -height : 0,
      duration: motion.slow.duration,
      easing: motion.slow.easing,
      useNativeDriver: true,
    }).start();
  }, [height, hidden, offset]);

  return (
    <Animated.View
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      style={[styles.container, { transform: [{ translateY: offset }] }]}
      pointerEvents={hidden ? 'none' : 'auto'}
    >
      <View style={styles.side}>{left}</View>
      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>
      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    minHeight: layout.headerMinHeight,
    paddingVertical: layout.headerPaddingVertical,
    paddingHorizontal: layout.headerPaddingHorizontal,
    backgroundColor: colors.bgElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  side: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    minWidth: 0,
  },
  sideRight: {
    justifyContent: 'flex-end',
  },
  title: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
  },
});

export default ScreenHeader;