/**
 * Container de tela (`DESIGN.md` §6.2).
 *
 * Elimina a repetição de padding em todas as telas: `padding 16` nas laterais,
 * respiro no topo e `paddingBottom` igual à altura da NavBar (64) para o
 * conteúdo nunca ficar preso atrás da barra.
 */

import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { layout, spacing } from '../../../style/app';

export interface ScreenContainerProps {
  /** `false` para telas curtas que não devem rolar. */
  scroll?: boolean;
  /** `false` nas telas sem NavBar (ex.: detalhe do relatório). */
  navPadding?: boolean;
  children?: ReactNode;
}

export function ScreenContainer({
  scroll = true,
  navPadding = true,
  children,
}: ScreenContainerProps) {
  const contentStyle = [
    styles.content,
    navPadding && { paddingBottom: layout.navHeight + spacing.s5 },
  ];

  if (!scroll) {
    return <View style={[styles.fixed, contentStyle]}>{children}</View>;
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={contentStyle}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  fixed: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingTop: layout.screenPaddingTop,
    gap: spacing.s4,
  },
});

export default ScreenContainer;