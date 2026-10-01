/**
 * NavBar (`DESIGN.md` §6.2, §7.2).
 *
 * Mora em `App.tsx`, não na Screen — é a única peça de navegação que o shell
 * possui. Os itens vêm de `navigation/routes.ts`, então adicionar uma tab é
 * uma linha lá e em lugar nenhum aqui.
 *
 * `hidden` desce com `motion.slow` (gravação imersiva) e desliga o toque no
 * fim da animação.
 */

import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { TABS, type ScreenId } from '../../../navigation/routes';
import { colors, iconSize, layout, motion, spacing, typography } from '../../../style/app';

export interface NavBarProps {
  active: ScreenId;
  onChange: (screen: ScreenId) => void;
  hidden?: boolean;
}

export function NavBar({ active, onChange, hidden = false }: NavBarProps) {
  const offset = useRef(new Animated.Value(hidden ? layout.navHeight : 0)).current;

  useEffect(() => {
    Animated.timing(offset, {
      toValue: hidden ? layout.navHeight : 0,
      duration: motion.slow.duration,
      easing: motion.slow.easing,
      useNativeDriver: true,
    }).start();
  }, [hidden, offset]);

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY: offset }] }]}
      pointerEvents={hidden ? 'none' : 'auto'}
    >
      {TABS.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <Pressable
            key={id}
            onPress={() => onChange(id)}
            style={styles.item}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: isActive }}
          >
            <Icon
              size={iconSize.xl}
              color={isActive ? colors.accent : colors.textMuted}
              strokeWidth={2}
            />
            <Text
              numberOfLines={1}
              style={[styles.label, { color: isActive ? colors.accent : colors.textMuted }]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  item: {
    flex: 1,
    minHeight: layout.navHeight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s1,
    paddingHorizontal: spacing.s1,
  },
  label: {
    ...typography.micro,
    textAlign: 'center',
  },
});

export default NavBar;