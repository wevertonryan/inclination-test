/**
 * Shell do app (`DESIGN.md` §7.1).
 *
 * `App.tsx` contém apenas: o container, a área da Screen e a `<NavBar>` — mais
 * o estado de navegação. Cada Screen renderiza o seu próprio `<ScreenHeader>`,
 * porque cada tela tem título e slots próprios.
 */

import { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { showsNavBar, type ScreenId } from './navigation/routes';
import { NavBar } from './app/components/layout/NavBar';
import DesignSystemScreen from './app/screens/DesignSystemScreen';
import HomeScreen from './app/screens/HomeScreen';
import { colors, spacing, typography, appStyles } from './style/app';

export default function App() {
  const [screen, setScreen] = useState<ScreenId>('home');

  return (
    <SafeAreaView style={appStyles.container}>
      <StatusBar style="light" />

      <View style={appStyles.screen}>{renderScreen(screen)}</View>

      <NavBar active={screen} onChange={setScreen} hidden={!showsNavBar(screen)} />
    </SafeAreaView>
  );
}

/** A tela da tab ativa. Só o shell sabe qual é; cada Screen cuida do seu layout. */
function renderScreen(screen: ScreenId) {
  switch (screen) {
    case 'home':
      return <HomeScreen />;
    case 'design':
      return <DesignSystemScreen />;
    default:
      return <PendingScreen screen={screen} />;
  }
}

/**
 * Placeholder das telas que ainda não existem. Entra a Calibração, os Relatórios
 * e as demais conforme forem entregues — o shell não muda, só o `switch`.
 */
function PendingScreen({ screen }: { screen: ScreenId }) {
  return (
    <View style={pendingStyles.container}>
      <Text style={pendingStyles.title}>{screen}</Text>
      <Text style={pendingStyles.description}>
        Tela em construção. A página de design está na tab "Design".
      </Text>
    </View>
  );
}

const pendingStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.s6,
    gap: spacing.s3,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  description: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});