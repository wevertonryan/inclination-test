/**
 * Container de tela (`DESIGN.md` §6.2, §7.3).
 *
 * Elimina a repetição de padding em todas as telas: `padding 16` nas laterais,
 * respiro no topo e `paddingBottom` igual à altura da NavBar **já com o inset
 * dela** — 64 + `insets.bottom` + 16 — para o conteúdo nunca ficar preso atrás
 * da barra.
 *
 * ## Por que a soma do inset aparece duas vezes
 *
 * Não é dupla contagem: é a mesma medida vista das duas pontas. A `NavBar` cresce
 * para `64 + inset.bottom` porque precisa encostar no gesto do sistema, e a tela
 * reserva `64 + inset.bottom` porque precisa caber acima dela. Se a tela
 * reservasse só 64, o último item ficaria sob a barra; se reservasse 64 sem o
 * inset, sobraria um vão do tamanho do gesto.
 *
 * ## Por que este componente é Tamagui e o `Inclinometer` não
 *
 * §7.6: a casca e o layout migraram para as primitivas do Tamagui; o que se move
 * — SVG a 60 Hz, animação com `useNativeDriver` — continua em React Native.
 * Aqui não há nada de alta frequência: é um `ScrollView` com três paddings.
 */

import type { ReactNode } from 'react';
import { ScrollView } from '@tamagui/scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();

  const content = {
    paddingHorizontal: spacing.s5,
    paddingTop: layout.screenPaddingTop + insets.top,
    paddingBottom: navPadding ? layout.navHeight + insets.bottom + spacing.s5 : spacing.s5,
    gap: spacing.s4,
    /**
     * `flexGrow: 1` é o que faz o modo sem rolagem ainda behaves como coluna de
     * altura cheia: o conteúdo estica até a viewport quando é menor, e cresce
     * quando é maior. Sem ele, um filho com `flex: 1` (o botão de gravar, que se
     * apoia no rodapé) não teria altura para se apoiar.
     */
    flexGrow: 1,
  };

  /**
   * **Um tipo só, sempre `ScrollView`.**
   *
   * A versão anterior devolvia `YStack` quando `scroll` era `false` e
   * `ScrollView` quando era `true`. React reconcilia por tipo de elemento, então
   * qualquer mudança de `scroll` — como `HomeScreen` faz com `scroll={immersive}`
   * ao começar a gravar — **desmontava e remontava a subárvore inteira**. Na Home
   * isso derrubava o `Inclinometer`: o `useInclination` antigo rodava o cleanup
   * (`sensor.stop()`) e o novo reabria a assinatura do sensor, o filtro
   * reiniciava frio e a calibração se perdia. O gráfico ficava vazio porque não
   * havia amostras, enquanto o cronômetro continuava andando — ele é alimentado
   * pelo tique de 100 ms do gravador, que não depende do sensor.
   *
   * `scrollEnabled` é só uma prop: não remonta nada.
   */
  return (
    <ScrollView
      flex={1}
      scrollEnabled={scroll}
      contentContainerStyle={content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

export default ScreenContainer;