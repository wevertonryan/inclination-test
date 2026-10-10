/**
 * Superfícies: `Card`, `ListItem`, `Separator`.
 *
 * ## `Card` — cabe quase inteiro
 *
 * O `Card` do Tamagui é a primitiva que o §6.2 já descrevia: `bgCard`, borda
 * hairline, `radius.lg`, `elevation.1`. Duas divergências e nenhuma é graves:
 * ele pede `backgroundColor: $background` (o `bg` do app, o mais escuro — o
 * `Section` corrige uma vez para toda a página), e `padded` não existe: o
 * padding é prop de espaço como em qualquer `styled`.
 *
 * ## `ListItem` — o `size` dele não serve
 *
 * A variante `size` do `ListItem` lê `tokens.size[val]` **e** `tokens.space[val]`
 * com a mesma chave. A escala do app é semântica e não tem essa interseção —
 * `size` tem `md`, `space` tem `s4`. Passar qualquer token dá metade do estilo:
 * com `size="$md"` a altura sai 16 e o padding não sai. Passar número também
 * não entra, porque a variante só tem o caso `'...size'`.
 *
 * Além disso o `ListRow` do §6.1 é **sem card próprio** — transparente, com
 * divisor entre linhas — e o `ListItem` nasce com `backgroundColor: $background`.
 * Daí o `ListRow` ser `ListItem` com três props a mais, não o contrário.
 *
 * E o slot `right` do §6.1 não existe: o `ListItem` renderiza ícone, bloco
 * `title`/`subTitle`, os `children` **dentro** desse bloco e, por último, o
 * `iconAfter`. O único slot à direita é `iconAfter`, e ele é de ícone. Um `right`
 * com texto — a data do `ReportCard` do §6.3 — obriga a montar a linha fora do
 * `ListItem`.
 */

import { Card } from '@tamagui/card';
import { ListItem } from '@tamagui/list-item';
import { Separator } from '@tamagui/separator';
import { XStack, YStack } from '@tamagui/stacks';
import { SizableText } from '@tamagui/text';
import { styled } from '@tamagui/web';
import { Bell, ChevronRight, MapPin, Search } from 'lucide-react-native';

import { iconSize } from '../../../style/app';
import { DemoRow, Meta, Section } from './Section';

/** `ListRow` do §6.1 não tem altura fixa; 44 é o alvo de toque mínimo do §8. */
const ROW_HEIGHT = 44;

/** `ListRow` do §6.1: sem card, `padding 12/16`, `gap 12`, divisor entre
 *  linhas, `right` alinhado à direita. */
const ListRow = styled(ListItem, {
  name: 'ListRow',

  backgroundColor: 'transparent',
  paddingHorizontal: '$space.s5',
  paddingVertical: '$space.s4',
  gap: '$space.s4',
  borderWidth: 0,
  borderBottomWidth: 1,
  borderBottomColor: '$color.border',
  borderRadius: 0,

  variants: {
    last: {
      true: { borderBottomWidth: 0 },
    },
  } as const,
})

const rows = [
  { icon: Search, title: 'Buscar relatórios', subtitle: 'Prova de Mar · Convés' },
  { icon: MapPin, title: 'Localização', subtitle: '—' },
  { icon: Bell, title: 'Aviso de fim de registering', subtitle: 'Última leitura 04:35' },
];

export function SurfaceSection() {
  return (
    <>
      <Section
        title="Card"
        note="§6.2 — bgCard, borda hairline de 1px, radius.lg, elevation.1 · padded vira prop de espaço"
      >
        <DemoRow>
          {[1, 2, 3].map((level) => (
            <Card
              key={level}
              width={120}
              height={72}
              alignItems="center"
              justifyContent="center"
              backgroundColor="$color.bgCard"
              borderRadius="$radius.lg"
              borderWidth={1}
              borderColor="$color.border"
              elevation={level * 2}
            >
              <SizableText fontSize={13} lineHeight={18} fontWeight="600" color="$color.text">
                elev {level}
              </SizableText>
            </Card>
          ))}
        </DemoRow>
      </Section>

      <Section
        title="ListItem"
        note="§6.1 ListRow — a variante size do Tamagui exige a mesma chave em size e space; a escala do app não tem"
      >
        <YStack
          borderRadius="$radius.lg"
          borderWidth={1}
          borderColor="$color.border"
          overflow="hidden"
          backgroundColor="$color.bgCard"
        >
          {rows.map(({ icon: Icon, title, subtitle }, index) => (
            <ListRow
              key={title}
              last={index === rows.length - 1}
              minHeight={ROW_HEIGHT}
              icon={
                <XStack
                  width={36}
                  height={36}
                  alignItems="center"
                  justifyContent="center"
                  borderRadius="$radius.pill"
                  backgroundColor="$color.bgElevated"
                >
                  <Icon size={iconSize.md} color="#F5A623" strokeWidth={2} />
                </XStack>
              }
              title={
                <SizableText fontSize={13} lineHeight={18} fontWeight="600" color="$color.text" numberOfLines={1}>
                  {title}
                </SizableText>
              }
              subTitle={
                <SizableText fontSize={11} lineHeight={15} fontWeight="700" color="$color.textMuted" numberOfLines={1}>
                  {subtitle}
                </SizableText>
              }
              iconAfter={<ChevronRight size={iconSize.sm} color="#5E6B87" strokeWidth={2} />}
            />
          ))}
        </YStack>
      </Section>

      <Section
        title="Separator"
        note="§6.1 Divider — o Tamagui já é exatamente o 1px que o DESIGN.md define"
      >
        <DemoRow>
          <YStack width={140} gap="$space.s2" alignItems="center">
            <Separator borderWidth={1} borderColor="$color.border" />
            <Meta>borderWidth 1 · $color.border</Meta>
          </YStack>

          <XStack width={200} gap="$space.s3" alignItems="center">
            <SizableText fontSize={11} lineHeight={15} fontWeight="700" color="$color.textFaint">
              esquerda
            </SizableText>
            <Separator
              flex={1}
              borderWidth={1}
              borderColor="$color.border"
              borderStyle="dashed"
            />
            <SizableText fontSize={11} lineHeight={15} fontWeight="700" color="$color.textFaint">
              direita
            </SizableText>
          </XStack>
        </DemoRow>
      </Section>
    </>
  );
}