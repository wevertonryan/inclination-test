/**
 * Shell do app (`DESIGN.md` §7.1).
 *
 * `App.tsx` contém apenas: os providers, o container, a área da Screen e a
 * `<NavBar>` — mais o estado de navegação. Cada Screen renderiza o seu próprio
 * `<ScreenHeader>`, porque cada tela tem título e slots próprios.
 *
 * ## Safe area
 *
 * Antes isto era um `<SafeAreaView>` do React Native, que está deprecado desde
 * a RN 0.79 e só aplica inset nas bordas que ele envolve. O problema é que a
 * NavBar é filha do container, então um inset único empurrava a barra para
 * baixo do gesto do sistema em vez de deixá-la *encostar* nele.
 *
 * Agora o `SafeAreaProvider` só mede, e cada borda consome o que precisa:
 * `ScreenContainer` consome `insets.top` e a `NavBar` consome `insets.bottom`.
 * O resultado é o mesmo pixel na tela, mas com cada componente dondo do seu
 * próprio respiro — que é o que permite a NavBar ter a borda de 1px colada no
 * gesto, como pede §6.2.
 */

import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TamaguiProvider } from '@tamagui/core';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { showsNavBar, type ScreenId } from './navigation/routes';
import { NavBar } from './app/components/layout/NavBar';
import DesignSystemScreen from './app/screens/DesignSystemScreen';
import HomeScreen from './app/screens/HomeScreen';
import { colors, spacing, typography, appStyles } from './style/app';
import appConfig from './tamagui.config';

export default function App() {
  return (
    <SafeAreaProvider>
      <TamaguiProvider config={appConfig} defaultTheme="dark">
        <Shell />
      </TamaguiProvider>
    </SafeAreaProvider>
  );
}

/** O shell de verdade, dentro dos providers — separado para os hooks ficarem
 *  sob `TamaguiProvider`, que precisa estar montado antes de resolver tokens. */
function Shell() {
  const [screen, setScreen] = useState<ScreenId>('home');

  return (
    <View style={appStyles.container}>
      <StatusBar style="light" />

      <View style={appStyles.screen}>{renderScreen(screen)}</View>

      <NavBar active={screen} onChange={setScreen} hidden={!showsNavBar(screen)} />
    </View>
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