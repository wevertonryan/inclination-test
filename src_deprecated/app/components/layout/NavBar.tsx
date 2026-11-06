/**
 * NavBar (`DESIGN.md` §6.2, §7.2, §7.3).
 *
 * Mora em `App.tsx`, não na Screen — é a única peça de navegação que o shell
 * possui. Os itens vêm de `navigation/routes.ts`, então adicionar uma tab é uma
 * linha lá e em lugar nenhum aqui.
 *
 * ## Onde a NavBar encosta no gesto do sistema
 *
 * O `SafeAreaView` que hoje involve o app inteiro aplicaria o mesmo inset nas
 * duas bordas de uma vez, e isso empurraria a barra para *abaixo* do gesto em vez
 * de deixá-la *encostar* nele. Por isso o `SafeAreaProvider` fica na raiz e só
 * mede: cada borda consome o que precisa. A NavBar consome `insets.bottom` e a
 * `ScreenContainer` reserva `64 + insets.bottom + 16` — a mesma medida vista das
 * duas pontas, não dupla contagem.
 *
 * ## Por que `Pressable` do RN e não `Button` do Tamagui
 *
* §7.6 manda a casca migrar para o Tamagui, mas o que se move continua em RN: a
 * animação de `hidden` é `Animated` com `useNativeDriver`. E o item da barra não
 * quer um `Button` — quer um alvo de toque com `accessibilityRole="tab"` e
 * `accessibilityState={{ selected }}`, que é semântica de `tablist`, não de botão.
 * `Button` do Tamagui resolve o `asChild` e o `ThemeableStack`, mas entregaria
 * um `button` onde a leitor de tela precisa ouvir "tab selecionada".
 */

import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { XStack, YStack } from '@tamagui/stacks';
import { SizableText } from '@tamagui/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TABS, type ScreenId } from '../../../navigation/routes';
import { colors, iconSize, layout, motion, typography } from '../../../style/app';

export interface NavBarProps {
  active: ScreenId;
  onChange: (screen: ScreenId) => void;
  hidden?: boolean;
}

export function NavBar({ active, onChange, hidden = false }: NavBarProps) {
  const insets = useSafeAreaInsets();
  const barHeight = layout.navHeight + insets.bottom;

  /**
   * `hidden` colapsa a **altura**, não translada.
   *
   * A versão anterior deslizava `translateY: navHeight` numa barra que tem
   * `navHeight + insets.bottom`: sobrava uma faixa do tamanho do gesto em cima da
   * tela, e — pior — a barra continuava ocupando layout, então a RecordingBar
   * ficava empilhada sobre ela. Animar `height` devolve o lugar e some inteiro.
   *
   * `useNativeDriver: false` é consequência disso, e é aceitável: `height` não
   * está no allowlist do módulo animado nativo, e esta é uma transição única, não
   * um movimento a 60 Hz. O `Modal` (§4) troca na mesma base.
   */
  const progress = useRef(new Animated.Value(hidden ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: hidden ? 0 : 1,
      duration: motion.slow.duration,
      easing: motion.slow.easing,
      useNativeDriver: false,
    }).start();
  }, [hidden, progress]);

  return (
    <Animated.View
      style={{
        height: progress.interpolate({ inputRange: [0, 1], outputRange: [0, barHeight] }),
        opacity: progress,
        overflow: 'hidden',
      }}
      pointerEvents={hidden ? 'none' : 'auto'}
      testID={hidden ? undefined : 'navbar'}
    >
      <XStack
        paddingBottom={insets.bottom}
        backgroundColor="$color.bgElevated"
        borderTopWidth={1}
        borderTopColor="$color.border"
      >
        {TABS.map(({ id, label, Icon }) => {
          const isActive = active === id;

          return (
            <Pressable
              key={id}
              onPress={() => onChange(id)}
              style={{ flex: 1 }}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: isActive }}
            >
              <YStack
                minHeight={layout.navHeight}
                alignItems="center"
                justifyContent="center"
                gap="$space.s1"
                paddingHorizontal="$space.s1"
              >
                {/* O `color` do Lucide é literal puro: `Icon` não entende
                    referência `$token`, então aqui vale a fachada `colors` do
                    §7.6 — o mesmo hex que `$color.accent` resolveria. */}
                <Icon
                  size={iconSize.xl}
                  color={isActive ? colors.accent : colors.textMuted}
                  strokeWidth={2}
                />
                <SizableText
                  color={isActive ? '$color.accent' : '$color.textMuted'}
                  style={styles.label}
                  textAlign="center"
                  numberOfLines={1}
                >
                  {label}
                </SizableText>
              </YStack>
            </Pressable>
          );
        })}
      </XStack>
    </Animated.View>
  );
}

/**
 * A tipografia vem escrita, e não de `fontFamily="$font.micro"` — a mesma regra
 * que `FormSection.tsx` §7.6 e `ui/Input.tsx` seguem.
 *
 * Os tokens de fonte deste projeto têm `fontSize` mas **não** têm o sub-mapa
 * `size`. Então, sem um `fontSize` explícito, o `getFontSizeToken` do Tamagui cai
 * no branch `inSize ?? '$4'`, procura `'$4'` entre `sm/md/lg/xl/xxl/hero/touch`,
 * não acha e avisa a cada render:
 *
 * > No font size found $4 undefined in size tokens […]
 *
 * E o pior não era o aviso: o retorno do fallback é `16`, então os rótulos das
 * abas estavam sendo desenhados a 16px em vez de 10px.
 */
const styles = StyleSheet.create({
  label: typography.micro,
});

export default NavBar;