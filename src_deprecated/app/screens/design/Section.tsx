/**
 * Peças de montagem da página de design.
 *
 * A galeria é composta por seções independentes e este arquivo é o que elas
 * compartilham: a moldura (título + nota + card), a linha de demonstração e a
 * legenda de metadado. Cada seção decide o que mostrar; o formato é o mesmo em
 * todas, para que duas seções possam ser comparadas olhando de longe.
 */

import type { ReactNode } from 'react';
import { Card } from '@tamagui/card';
import { XStack, YStack } from '@tamagui/stacks';
import { SizableText } from '@tamagui/text';

export interface SectionProps {
  title: string;
  /** A ressalva que muda o veredito — "fundo de verdade é `bgCard`, não o
   *  `$background` que o Card pede". */
  note?: string;
  children: ReactNode;
}

export function Section({ title, note, children }: SectionProps) {
  return (
    <YStack gap="$space.s3">
      <YStack gap="$space.s1">
        <SizableText fontSize={16} lineHeight={22} fontWeight="700" color="$color.text">
          {title}
        </SizableText>
        {note ? (
          <SizableText fontSize={11} lineHeight={15} fontWeight="700" color="$color.textMuted">
            {note}
          </SizableText>
        ) : null}
      </YStack>

      {/*
        `Card` pede `backgroundColor: $background`, que no tema do app resolve
        para o `bg` — o fundo da tela, o mais escuro. A superfície de conteúdo
        do DESIGN.md §3.3 é `bgCard`. A identidade do app entra aqui, uma vez,
        em vez de em cada uso de Card do app inteiro.
      */}
      <Card
        backgroundColor="$color.bgCard"
        borderRadius="$radius.lg"
        borderWidth={1}
        borderColor="$color.border"
        padding="$space.s5"
        gap="$space.s4"
        elevation={2}
      >
        {children}
      </Card>
    </YStack>
  );
}

/** Linha de amostras: quebra quando não cabe, em vez de cortar. */
export function DemoRow({ children }: { children: ReactNode }) {
  return (
    <XStack alignItems="center" gap="$space.s3" flexWrap="wrap">
      {children}
    </XStack>
  );
}

/** Legenda: o nome do token ou o valor, ao lado da amostra que ele produz. */
export function Meta({ children }: { children: ReactNode }) {
  return (
    <SizableText fontSize={11} lineHeight={15} fontWeight="700" color="$color.textFaint">
      {children}
    </SizableText>
  );
}