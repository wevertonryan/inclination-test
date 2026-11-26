/**
 * O veredito da galeria. Cada linha diz o que acontece com aquele componente,
 * e a galeria existe para que a linha não seja opinião.
 *
 * O resumo, antes do detalhe: **o Tamagui resolve o `Input` e resolve o
 * `Select`, e resolve o `Toast` com uma troca de import. O resto ou já estava
 * resolvido em código próprio (`Card`, `ListRow`, `Gauge`, `Spinner`,
 * `Inclinometer`, `FilterChips`), ou é peça que o app ainda não tem tela para
 * usar (`Avatar`, `Checkbox`, `RadioGroup`, `Progress`, `Switch`).**
 *
 * A consequência prática é que a decisão de §7.6 — Tamagui para o shell,
 * código próprio para o que é específico — se sustenta, com um acréscimo: o
 * `Input` e o `Select` passam a ser candidatos reais, porque a UI kit entrega
 * os dois com a API certa e sem dependência nativa nova.
 *
 * O que não muda: `Gauge`, `Inclinometer` e `Spinner` continuam fora. SVG
 * customizado e valor a 60 Hz não são o que uma UI kit resolve.
 */

import { YStack } from '@tamagui/stacks';
import { SizableText } from '@tamagui/text';

import { Section } from './Section';

type Verdict = 'assume' | 'pode' | 'fora' | 'nao';

const VERDICT_LABEL: Record<Verdict, string> = {
  assume: 'Assume',
  pode: 'Pode',
  fora: 'Fica fora',
  nao: 'Sem tela ainda',
};

const VERDICT_COLOR: Record<Verdict, string> = {
  assume: '$color.accent',
  pode: '$color.accent',
  fora: '$color.textFaint',
  nao: '$color.textMuted',
};

const VERDICTS: { verdict: Verdict; name: string; note: string }[] = [
  {
    verdict: 'assume',
    name: 'Input · Label',
    note: '§6.1 já é `Input` no papel; a API bate, inclusive o estado de erro.',
  },
  {
    verdict: 'assume',
    name: 'Select',
    note: '3 a 8 opções, sem busca. Onboarding e configurações.',
  },
  {
    verdict: 'pode',
    name: 'Toast',
    note: 'fecha a lacuna de feedback da calibração; exige `@tamagui/toast/v2`.',
  },
  {
    verdict: 'pode',
    name: 'Collapsible · Accordion',
    note: 'lista de sensores da Calibração; animação no driver RN.',
  },
  {
    verdict: 'pode',
    name: 'Tabs',
    note: 'sub-página (Lista · Gráfico · Resumo), não destino de primeiro nível.',
  },
  {
    verdict: 'nao',
    name: 'Switch · Checkbox · RadioGroup',
    note: 'configurações que a Settings ainda não tem.',
  },
  {
    verdict: 'nao',
    name: 'Slider · Progress · Avatar',
    note: 'ajuste fino, progresso e identidade: nenhuma tela hoje.',
  },
  {
    verdict: 'fora',
    name: 'Gauge · Inclinometer · Spinner',
    note: 'SVG customizado e leitura a 60 Hz — §7.6 já é código próprio.',
  },
  {
    verdict: 'fora',
    name: 'Card · ListItem · Button',
    note: 'já existem como `Card`, `ListRow`, `Button` e com as regras do §6.',
  },
];

export function VerdictSection() {
  return (
    <Section
      title="Veredito"
      note="o que a galeria mostra componente a componente"
    >
      <YStack
        borderRadius="$radius.md"
        borderWidth={1}
        borderColor="$color.border"
        overflow="hidden"
      >
        {VERDICTS.map(({ verdict, name, note }, index) => (
          <YStack
            key={name}
            gap="$space.s2"
            paddingHorizontal="$space.s4"
            paddingVertical="$space.s3"
            borderTopWidth={index === 0 ? 0 : 1}
            borderTopColor="$color.border"
            backgroundColor={index % 2 === 0 ? 'transparent' : '$color.bgInput'}
          >
            <YStack flexDirection="row" alignItems="center" gap="$space.s3">
              <SizableText
                fontSize={11} lineHeight={15} fontWeight="700"
                color={VERDICT_COLOR[verdict]}
                minWidth={104}
              >
                {VERDICT_LABEL[verdict]}
              </SizableText>
              <SizableText fontSize={13} lineHeight={18} fontWeight="600" color="$color.text">
                {name}
              </SizableText>
            </YStack>

            <SizableText
              fontSize={11} lineHeight={15} fontWeight="700"
              color="$color.textMuted"
              paddingLeft={104}
            >
              {note}
            </SizableText>
          </YStack>
        ))}
      </YStack>

      <YStack gap="$space.s3" width="100%">
        <SizableText fontSize={13} lineHeight={18} fontWeight="600" color="$color.text">
          O que a galeria mudou na recomendação
        </SizableText>
        <SizableText fontSize={14} lineHeight={20} fontWeight="400" color="$color.textMuted">
          §7.6 mantém a divisão — shell com Tamagui, sensores e gráficos com
          código próprio — e ganha dois candidatos a mais: `Input` e `Select`
          deixam de ser algo que o app teria de escrever e passam a ser algo que
          o app usa. O `Toast` entra como aprovação condicional, ligada a um
          único import: `@tamagui/toast/v2`, não `@tamagui/toast`.
        </SizableText>
      </YStack>
    </Section>
  );
}