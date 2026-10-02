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
 *
 * ## `RecordingProvider`
 *
 * A `RecordingBar` mora aqui, irmã da `NavBar` que ela substitui durante a
 * gravação (§6.3), e o botão que inicia a gravação mora na `HomeScreen`. Os dois
 * precisam do mesmo `mode`, e instanciar o gravador nos dois daria duas sessões e
 * duas linhas em `recordings`. O provider sobe uma única instância e entrega
 * `mode` para a barra e `captureAngle` para a tela.
 *
 * Ele fica acima do `Shell` e não dentro dele pelo mesmo motivo do `Toaster`: é
 * estado que sobrevive à tela.
 *
 * ## `PortalProvider`
 *
 * O `Portal` nativo do Tamagui tem dois caminhos: *teleport*, que preserva o
 * contexto do React, e o sistema Gorhom, em JS, que precisa de um host montado.
 * O estado padrão é `type: null` — ou seja, sem host, um `Portal` simplesmente
 * não renderiza, que é o que aconteceria com o `<Toaster />` daqui de baixo.
 *
 * Ligar o teleport exigiria `react-native-teleport`, mais uma dependência nativa
 * e um rebuild. O `PortalProvider` é a alternativa que o próprio pacote exporta
 * e não custa nada: é o host do caminho Gorhom. Fica dentro do
 * `TamaguiProvider` porque o portal de teleporte lê o tema do contexto.
 */

import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TamaguiProvider } from '@tamagui/core';
import { PortalProvider } from '@tamagui/portal';
import { Toaster } from '@tamagui/toast/v2';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { showsNavBar, type ScreenId } from './navigation/routes';
import { NavBar } from './app/components/layout/NavBar';
import { RecordingBar } from './app/components/features/RecordingBar';
import DesignSystemScreen from './app/screens/DesignSystemScreen';
import HomeScreen from './app/screens/HomeScreen';
import { RecordingProvider, useRecordingControl } from './core/recording/RecordingProvider';
import { colors, spacing, typography, appStyles } from './style/app';
import appConfig from './tamagui.config';

export default function App() {
  return (
    <SafeAreaProvider>
      <TamaguiProvider config={appConfig} defaultTheme="dark">
        <PortalProvider>
          <RecordingProvider>
            <Shell />
          </RecordingProvider>

          {/* Fica aqui, e não dentro do `Shell`, porque o toast é singleton: ele
           *  precisa sobreviver à troca de tela e ser chamado de um `catch` ou de
           *  um listener de sensor, longe de qualquer componente. `Toaster` é
           *  quem dá corpo ao `toast.success()` de `@tamagui/toast/v2` — sem ele
           *  a chamada não erra, apenas não desenha. O `offset` de 88 é o
           *  `size.touch` (44) do `ScreenHeader` somado ao `space.s8` (32) que o
           *  precede, mais 12 de folga: o `bottom` do toast tem de cair abaixo
           *  do header, nunca atrás dele. */}
          <Toaster offset={{ top: 88 }} duration={2600} />
        </PortalProvider>
      </TamaguiProvider>
    </SafeAreaProvider>
  );
}

/** O shell de verdade, dentro dos providers — separado para os hooks ficarem
 *  sob `TamaguiProvider`, que precisa estar montado antes de resolver tokens. */
function Shell() {
  const [screen, setScreen] = useState<ScreenId>('home');
  /**
   * `useRecordingControl`, e não `useRecording`: o shell só precisa do `mode` e
   * das ações. A parte que muda a 10 Hz (relógio e amostras) mora no outro
   * contexto, e é isso que impede a NavBar e a RecordingBar de re-renderizarem a
   * cada tique do gravador.
   */
  const recording = useRecordingControl();

  // Imersivo é o termo do protótipo: NavBar e header saem de cena e o cronômetro
  // assume o lugar do header. Sem isso, o usuário trocaria de aba no meio de uma
  // prova e a `RecordingBar` continuaria no rodapé de outra tela.
  const immersive = recording.mode !== 'idle';

  return (
    <View style={appStyles.container}>
      <StatusBar style="light" />

      <View style={appStyles.screen}>{renderScreen(screen)}</View>

      <NavBar active={screen} onChange={setScreen} hidden={immersive || !showsNavBar(screen)} />

      {/* Sempre montada: ela cuida do próprio unmount atrasado, para NavBar e barra
          *trocarem de lugar* e não haver corte entre os dois (§4). */}
      <RecordingBar
        visible={immersive}
        mode={recording.mode}
        onCancel={recording.requestCancel}
        onToggle={() => void recording.toggle()}
        onSave={recording.requestSave}
      />
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