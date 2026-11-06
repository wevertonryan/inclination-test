/**
 * `Tabs` — a pergunta que a página precisa responder direito: `Tabs` troca a
 * NavBar?
 *
 * Não. São coisas diferentes. A NavBar do §7.2 tem **6 destinos de primeiro
 * nível**, ícone + label, estado que mora no `App.tsx` e barra fixa no rodapé.
 * `Tabs` é para sub-páginas de *dentro* de um destino: lista de Relatórios /
 * detalhe, Medição / Calibração. O `Tabs.Content` troca por `value`, e o
 * `Tabs.Tab` é um alvo pequeno — não o alvo de toque de 44 do §8 com ícone e
 * label embaixo.
 *
 * O encaixe real é nos filtros do `ReportsScreen`: "Lista · Gráfico · Resumo" é
 * sub-página, e `Tabs` faz isso com `activationMode`, teclado e estado próprio,
 * sem as duas linhas de `Chip` que o `FilterChips` do §6.3 usa hoje para o
 * período.
 */

import { useState } from 'react';
import { Tabs } from '@tamagui/tabs';
import { XStack, YStack } from '@tamagui/stacks';
import { SizableText } from '@tamagui/text';
import { ChartNoAxesCombined, FileText, LayoutList } from 'lucide-react-native';

import { iconSize } from '../../../style/app';
import { Section } from './Section';

const PANES = [
  {
    value: 'lista',
    label: 'Lista',
    icon: LayoutList,
    body: 'Lista de relatórios com data e local à direita — o `ListRow` do §6.1.',
  },
  {
    value: 'grafico',
    label: 'Gráfico',
    icon: ChartNoAxesCombined,
    body: '`LineChart` SVG do §6.3, com legenda de dot 8px + nome `caption`.',
  },
  {
    value: 'resumo',
    label: 'Resumo',
    icon: FileText,
    body: 'Máximo, mínimo e amplitude em `display` tabular.',
  },
] as const;

export function TabsSection() {
  const [value, setValue] = useState<string>('lista');

  return (
    <Section
      title="Tabs"
      note="sub-páginas de um destino — não substitui a NavBar (6 destinos, ícone + label, estado no App.tsx)"
    >
      <Tabs
        value={value}
        onValueChange={setValue}
        width="100%"
        gap="$space.s4"
      >
        <Tabs.List
          flexDirection="row"
          gap="$space.s2"
          backgroundColor="$color.bgInput"
          padding="$space.s1"
          borderRadius="$radius.pill"
          borderWidth={1}
          borderColor="$color.border"
        >
          {PANES.map(({ value: tab, label, icon: Icon }) => {
            const active = value === tab;

            return (
              <Tabs.Tab
                key={tab}
                value={tab}
                flex={1}
                minHeight={40}
                flexDirection="row"
                alignItems="center"
                justifyContent="center"
                gap="$space.s2"
                borderRadius="$radius.pill"
                backgroundColor={active ? '$color.accent' : 'transparent'}
                borderColor="transparent"
                borderWidth={1}
                pressStyle={{ opacity: 0.7 }}
              >
                <Icon
                  size={iconSize.md}
                  color={active ? '#1A1505' : '#8B98B4'}
                  strokeWidth={2}
                />
                <SizableText
                  fontSize={13} lineHeight={18} fontWeight="600"
                  color={active ? '$color.onAccent' : '$color.textMuted'}
                >
                  {label}
                </SizableText>
              </Tabs.Tab>
            );
          })}
        </Tabs.List>

        {PANES.map(({ value: pane, body }) => (
          <Tabs.Content
            key={pane}
            value={pane}
            padding="$space.s4"
            borderRadius="$radius.md"
            borderWidth={1}
            borderColor="$color.border"
            backgroundColor="$color.bgInput"
          >
            <XStack alignItems="center" gap="$space.s3">
              <YStack flex={1}>
                <SizableText fontSize={14} lineHeight={20} fontWeight="400" color="$color.text">
                  {body}
                </SizableText>
              </YStack>
            </XStack>
          </Tabs.Content>
        ))}
      </Tabs>
    </Section>
  );
}