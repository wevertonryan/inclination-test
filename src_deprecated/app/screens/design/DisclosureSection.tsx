/**
 * `Collapsible` e `Accordion` — o encaixe mais óbvio do kit no app que ainda não
 * existe: a lista de sensores da `CalibrationScreen`.
 *
 * Uma tela de calibração mostra eixo X, eixo Y, eixo Z, cada um com leitura atual
 * e botão de calibrar. Hoje isso é uma tabela com scroll; com `Accordion`, cada
 * eixo vira uma seção que abre e mostra leitura, offset e histórico. O
 * `Collapsible` é a mesma peça sem o grupo — serve para um relatório que abre o
 * bloco de metadados.
 *
 * O ponto de atenção é o mesmo dos outros: a animação de abrir/fechar vem do
 * driver de animação configurado em `tamagui.config.ts` (`fast`/`base`/`exit`/
 * `slow`), que no React Native é o `Animated` rodando na thread do JS — sem
 * `useNativeDriver`. Para uma lista de três ou quatro seções isso é irrelevante;
 * para algo que anima o tempo todo seria motivo para sair do Tamagui, como §7.6
 * já faz com o `Inclinometer`.
 */

import { Accordion } from '@tamagui/accordion';
import { Collapsible } from '@tamagui/collapsible';
import { ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { XStack, YStack } from '@tamagui/stacks';
import { SizableText } from '@tamagui/text';

import { colors, formatAngle } from '../../../style/app';
import { DemoRow, Section } from './Section';

const SENSORS = [
  {
    value: 'x',
    label: 'Eixo X · roll',
    reading: formatAngle(3.2),
    offset: formatAngle(-0.4),
  },
  {
    value: 'y',
    label: 'Eixo Y · trim',
    reading: formatAngle(-1.8),
    offset: formatAngle(0.9),
  },
  {
    value: 'z',
    label: 'Eixo Z · abertura',
    reading: formatAngle(2.1),
    offset: formatAngle(0.2),
  },
];

export function DisclosureSection() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Section
        title="Collapsible"
        note="peça solta — abre e fecha sem grupo; serve para um bloco de metadados dentro de um relatório"
      >
        <YStack
          borderRadius="$radius.md"
          borderWidth={1}
          borderColor="$color.border"
          backgroundColor="$color.bgInput"
          overflow="hidden"
        >
          <Collapsible
            open={open}
            onOpenChange={setOpen}
          >
            <Collapsible.Trigger>
              <XStack
                alignItems="center"
                justifyContent="space-between"
                minHeight={44}
                paddingHorizontal="$space.s4"
                paddingVertical="$space.s3"
                pressStyle={{ backgroundColor: '$color.backgroundPress' }}
              >
                <SizableText fontSize={13} lineHeight={18} fontWeight="600" color="$color.text">
                  Leitura bruta do acelerômetro
                </SizableText>
                <ChevronDown
                  size={16}
                  color={colors.textMuted}
                  strokeWidth={2}
                  style={{
                    transform: [{ rotate: open ? '180deg' : '0deg' }],
                  }}
                />
              </XStack>
            </Collapsible.Trigger>

            <Collapsible.Content
              paddingHorizontal="$space.s4"
              paddingBottom="$space.s4"
            >
              <SizableText fontSize={14} lineHeight={20} fontWeight="400" color="$color.textMuted">
                Nenhum ajuste aplicado. Os valores vêm de `useInclination`, já
                filtrados — a tela nunca fala com o sensor diretamente (§7.5).
              </SizableText>
            </Collapsible.Content>
          </Collapsible>
        </YStack>
      </Section>

      <Section
        title="Accordion"
        note="grupo de seções — o encaixe direto na lista de sensores da CalibrationScreen"
      >
        <YStack
          borderRadius="$radius.md"
          borderWidth={1}
          borderColor="$color.border"
          backgroundColor="$color.bgInput"
          overflow="hidden"
        >
          <Accordion
            type="single"
            collapsible
          >
            {SENSORS.map(({ value, label, reading, offset }) => (
              <Accordion.Item key={value} value={value}>
                <Accordion.Header>
                  <Accordion.Trigger
                    minHeight={44}
                    paddingHorizontal="$space.s4"
                    paddingVertical="$space.s3"
                    pressStyle={{ backgroundColor: '$color.backgroundPress' }}
                  >
                    <XStack alignItems="center" justifyContent="space-between" width="100%">
                      <SizableText fontSize={13} lineHeight={18} fontWeight="600" color="$color.text">
                        {label}
                      </SizableText>
                      <SizableText
                        fontSize={13} lineHeight={18} fontWeight="600"
                        color="$color.accent"
                        fontVariant={['tabular-nums']}
                      >
                        {reading}
                      </SizableText>
                    </XStack>
                  </Accordion.Trigger>
                </Accordion.Header>

                <Accordion.Content
                  paddingHorizontal="$space.s4"
                  paddingBottom="$space.s4"
                >
                  <DemoRow>
                    <SizableText fontSize={11} lineHeight={15} fontWeight="700" color="$color.textMuted">
                      offset {offset} · 3 amostras · última há 4 min
                    </SizableText>
                  </DemoRow>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion>
        </YStack>
      </Section>
    </>
  );
}