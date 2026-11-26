/**
 * Header da própria Screen (`DESIGN.md` §6.2, §7.1).
 *
 * Três slots: `left` · `title` centralizado · `right`. Cada tela tem título e
 * slots próprios, então o header mora na Screen, não no shell — e rola junto com
 * o conteúdo.
 *
 * ## O truque do título centralizado
 *
 * Os laterais levam `flex: 1` + `minWidth: 0`. Sem o `minWidth: 0`, um slot
 * esquerdo largo (um `Chip` de status, um nome de sensor) estica a `View` e
 * empurra o título para fora do centro em vez de truncar. Com ele, o título fica
 * sempre no meio geométrico da tela e é o título que cede espaço.
 *
 * ## Onde Tamagui entra e onde não
 *
 * A casca é `XStack`/`SizableText` (§7.6: layout nasce Tamagui). A animação de
 * `hidden` continua em `Animated` do RN com `useNativeDriver: true`, porque ela
 * desloca a tela a 60 Hz durante a gravação imersiva — o caminho em que o
 * Tamagui não é melhor. `translateY` de `View` está no allowlist do módulo
 * animado nativo; é o mesmo motivo que segura o `Inclinometer` no SVG.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { XStack } from '@tamagui/stacks';
import { SizableText } from '@tamagui/text';

import { layout, motion, typography } from '../../../style/app';

export interface ScreenHeaderProps {
  title: string;
  left?: ReactNode;
  right?: ReactNode;
  /** Some deslizando para cima — gravação imersiva, quando o cronômetro ocupa
   *  aquele lugar. */
  hidden?: boolean;
}

export function ScreenHeader({ title, left, right, hidden = false }: ScreenHeaderProps) {
  /**
   * A altura medida é a do **conteúdo**, e vive num estado: `onLayout` no
   * `Animated.View` de fora mediria a própria altura animada, e o feedback
   * realimentaria a animação.
   */
  const [contentHeight, setContentHeight] = useState<number>(layout.headerMinHeight);
  const progress = useRef(new Animated.Value(hidden ? 0 : 1)).current;

  /**
   * `hidden` colapsa a altura em vez de só transladar. A versão anterior
   * animava `translateY: -height` e deixava um buraco do tamanho do header no
   * meio da tela — e, se o `onLayout` não tivesse rodado, o header ficava pela
   * metade, porque o desvio era `-headerMinHeight` e não a altura real.
   *
   * `useNativeDriver: false` porque `height` não está no allowlist do módulo
   * animado nativo; é uma transição única, não um movimento a 60 Hz.
   */
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
        height: progress.interpolate({ inputRange: [0, 1], outputRange: [0, contentHeight] }),
        opacity: progress,
        overflow: 'hidden',
      }}
      pointerEvents={hidden ? 'none' : 'auto'}
      testID={hidden ? undefined : 'screen-header'}
    >
      <XStack
        onLayout={(event) => setContentHeight(event.nativeEvent.layout.height)}
        alignItems="center"
        minHeight={layout.headerMinHeight}
        paddingVertical="$space.s14"
        paddingHorizontal="$space.s5"
        gap="$space.s3"
        backgroundColor="$color.bgElevated"
        borderBottomWidth={1}
        borderBottomColor="$color.border"
      >
        <XStack flex={1} minWidth={0} alignItems="center" gap="$space.s3">
          {left}
        </XStack>

        <SizableText
          flexShrink={1}
          color="$color.text"
          style={styles.title}
          textAlign="center"
          numberOfLines={1}
        >
          {title}
        </SizableText>

        <XStack flex={1} minWidth={0} alignItems="center" justifyContent="flex-end" gap="$space.s3">
          {right}
        </XStack>
      </XStack>
    </Animated.View>
  );
}

/**
 * `fontSize` explícito, e não `fontFamily="$font.title"`
 * — mesma razão do `NavBar`: os tokens de fonte não têm sub-mapa `size`, e sem
 * um `fontSize` o Tamagui procura `'$4'`, não acha e avisa a cada render.
 */
const styles = StyleSheet.create({
  title: typography.title,
});

export default ScreenHeader;