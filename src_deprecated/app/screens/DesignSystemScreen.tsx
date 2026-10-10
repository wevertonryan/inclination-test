/**
 * Galeria de avaliação do Tamagui.
 *
 * ## O que esta tela é
 *
 * Não é tela do produto. O `App.tsx` já espera `DesignSystemScreen` na tab
 * `design`, e este arquivo é o que estava faltando para o projeto compilar —
 * mas o motivo de ela existir é outro: é o lugar onde os 17 pacotes do Tamagui
 * aparecem **comificados com as regras de `DESIGN.md`**, para que a recomendação
 * de §7.6 possa ser conferida em vez de acreditada.
 *
 * Cada seção é um arquivo só, e o docstring de cada um diz o que o componente
 * resolve e o que ele não resolve. O `VerdictSection` fecha a página com a
 * tabela — e a tabela só diz algo porque as seções acima podem ser abertas e
 * testadas.
 *
 * ## O que ficou de fora, e por quê
 *
 * - **`Tooltip`** é `no-op` no React Native: o pacote retorna o próprio filho.
 *   Não há hover em toque, então a seção mostraria um componente que não faz
 *   nada.
 * - **`Dialog`, `Popover`, `Popper`** importam de `react-dom` e não empacotam
 *   para native. `Popover` também exige `@react-native/async-storage` para o
 *   estado de posição, o que é uma dependência nativa a mais por um menu.
 * - **`Slider`** está aqui e **não** substitui o `Gauge`: o `Gauge` do §6.3 é
 *   arco SVG com faixa entre mínimo e máximo e dois indicadores; o `Slider` é uma
 *   régua reta com uma alça. Serve para ajuste num formulário.
 *
 * ## A armadilha que atravessa a página inteira
 *
 * `size` no Tamagui é **altura de controle**, indexada pela escala numérica do
 * Tamagui (`$1`…`$12`) — e os tokens deste projeto são semânticos, com nomes
 * como `s4` e `md`. Consequência prática, repetida em `Button`, `Select`,
 * `ListItem` e `Avatar`:
 *
 * 1. Todo `defaultVariants.size` do Tamagui aponta para `$2` ou `$true`, que
 *    **não existem** aqui. Sem `size` explícito, `minHeight` resolve
 *    `undefined` e o controle nasce com a altura do conteúdo.
 * 2. Passar `size="$md"` também não serve: `tokens.size.md` é 16, e o
 *    `Input` do §6.1 tem 44 de altura. O que dá o valor certo é `size.touch` (44)
 *    para altura de controle, e aí o `radius` precisa vir explícito, porque o
 *    `defaultVariants` do `Select` faz `radius: tokens.radius[val] ?? val` e
 *    `tokens.radius.$touch` não existe.
 *
 * Ou seja: `size` precisa ser passado sempre, e `$touch` é o único token do
 * grupo `size` que representa altura de controle. É a conclusão mais importante
 * que a galeria produz.
 */

import { ScrollView } from 'react-native';

import { ButtonSection } from './design/ButtonSection';
import { DisclosureSection } from './design/DisclosureSection';
import { FormSection } from './design/FormSection';
import { IdentitySection } from './design/IdentitySection';
import { OverlaySection } from './design/OverlaySection';
import { SurfaceSection } from './design/SurfaceSection';
import { TabsSection } from './design/TabsSection';
import { TokenSection } from './design/TokenSection';
import { VerdictSection } from './design/VerdictSection';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { appStyles, spacing } from '../../style/app';

export default function DesignSystemScreen() {
  return (
    <>
      {/* `ScreenHeader` não tem `subtitle` — o slot central é `numberOfLines={1}`.
       *  A descrição da página mora na primeira seção, que é onde `TokenSection`
       *  já abre explicando o que a galeria é. */}
      <ScreenHeader title="Design system · Tamagui" />

      <ScrollView
        style={appStyles.screen}
        contentContainerStyle={galleryStyles.content}
        showsVerticalScrollIndicator={false}
      >
        <TokenSection />
        <ButtonSection />
        <SurfaceSection />
        <FormSection />
        <TabsSection />
        <DisclosureSection />
        <OverlaySection />
        <IdentitySection />
        <VerdictSection />
      </ScrollView>
    </>
  );
}

const galleryStyles = {
  content: {
    paddingHorizontal: spacing.s5,
    paddingTop: spacing.s5,
    paddingBottom: spacing.s8,
    gap: spacing.s6,
  },
};