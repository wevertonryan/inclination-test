/**
 * `Button` do Tamagui — o componente que o app mais usaria, e o que mais tem a
 * dizer.
 *
 * ## As três descobertas que o DESIGN.md §6.1 exige
 *
 * 1. **Cor.** O `Button` nasce com `backgroundColor: $background`, que no tema do
 *    app é o `bg` — o fundo da tela. Nenhum dos três variantes do §6.1 quer
 *    isso, então a identidade entra em `styled`, uma vez.
 * 2. **Altura.** O `size` do Tamagui **não** é um tamanho de fonte: `getButtonSized`
 *    deriva `height`, `paddingHorizontal` e `borderRadius` do token de tamanho,
 *    e ainda põe `gap = altura × 0.4`. A escala do app é semântica (`sm 14`,
 *    `md 16`), não numérica, então `size="$md"` resolve `height: 16` — um botão
 *    de 16px. Passando **número**, o Tamagui acerta: `size={44}` dá `height: 44`
 *    e `paddingHorizontal: 11`. O `gap` continua errado (17.6 contra os 4 do
 *    §6.1) e é sobrescrito à mão.
 * 3. **`loading` não existe.** A prop não está no `Button` do Tamagui 2.7.7. O
 *    §6.1 pede `loading?`, então ele se compõe: `Spinner` dentro, `disabled`
 *    junto, e o rótulo vira `textFaint` para que a leitura não dependa só do
 *    spinner girando — §8 proíbe cor isolada, e um spinner sozinho também é
 *    informação só por imagem.
 */

import { useState } from 'react';
import { Button } from '@tamagui/button';
import { Spinner } from '@tamagui/spinner';
import { XStack, YStack } from '@tamagui/stacks';
import { SizableText } from '@tamagui/text';
import { styled } from '@tamagui/web';
import { Trash2, Wrench } from 'lucide-react-native';

import { colors } from '../../../style/app';
import { DemoRow, Meta, Section } from './Section';

/** §6.1: `primary` accent com texto `onAccent`, `ghost` `bgCard` + borda,
 *  `danger` `danger` com texto branco. Alturas 32 / 44 / 52, `radius.md`. */
const ActionButton = styled(Button, {
  name: 'ActionButton',

  // O `gap` que o Tamagui calcula a partir da altura (×0.4) é 17.6px num botão
  // de 44. O §6.1 pede 4.
  gap: '$space.s2',
  borderRadius: '$radius.md',
  // Ver a nota sobre `$font.*` no `TokenSection.tsx`: escrever os três valores
  // é o que impede o `getFontSizeToken` de procurar `'$4'` e avisar.
  fontSize: 13,
  fontWeight: '600',
  paddingHorizontal: '$space.s4',
  minWidth: 96,

  pressStyle: {
    opacity: 0.86,
  },

  variants: {
    tone: {
      primary: {
        backgroundColor: '$color.accent',
        borderColor: '$color.accent',
        color: '$color.onAccent',
        hoverStyle: { backgroundColor: '$color.accentStrong', borderColor: '$color.accentStrong' },
      },
      ghost: {
        backgroundColor: '$color.bgCard',
        borderColor: '$color.border',
        color: '$color.text',
      },
      danger: {
        backgroundColor: '$color.danger',
        borderColor: '$color.danger',
        color: '#FFFFFF',
      },
    } as const,
  } as const,

  defaultVariants: {
    tone: 'primary',
  },
});

/** Alturas do §6.1 em número — o caminho que o Tamagui entende. */
const HEIGHTS = { sm: 32, md: 44, lg: 52 } as const;

export function ButtonSection() {
  const [busy, setBusy] = useState(false);

  return (
    <Section
      title="Button"
      note="alturas 32 / 44 / 52 como número · gap 4 fixado à mão · loading composto com Spinner"
    >
      <DemoRow>
        <ActionButton height={HEIGHTS.md} onPress={() => {}}>
          Primário
        </ActionButton>
        <ActionButton height={HEIGHTS.md} tone="ghost" onPress={() => {}}>
          Ghost
        </ActionButton>
        <ActionButton height={HEIGHTS.md} tone="danger" onPress={() => {}}>
          Danger
        </ActionButton>
      </DemoRow>

      <DemoRow>
        <ActionButton
          height={HEIGHTS.md}
          icon={<Wrench size={16} color="#1A1505" strokeWidth={2} />}
          onPress={() => {}}
        >
          Com ícone
        </ActionButton>

        <ActionButton
          height={HEIGHTS.md}
          icon={<Trash2 size={16} color="#1A1505" strokeWidth={2} />}
          onPress={() => {}}
        >
          Ícone à esquerda
        </ActionButton>
      </DemoRow>

      <DemoRow>
        <ActionButton height={HEIGHTS.md} disabled onPress={() => {}}>
          Desabilitado
        </ActionButton>

        <ActionButton height={HEIGHTS.md} disabled={busy} onPress={() => setBusy(true)}>
          {busy ? (
            <XStack alignItems="center" gap="$space.s2">
              {/* `Spinner` é um `ActivityIndicator` com dois tamanhos e uma cor
                  literal. Não aceita `$token` — quem quiser o `LoaderCircle`
                  girando do §6.1 monta com Lucide + `Animated`. */}
              <Spinner size="small" color={colors.onAccent} />
              <SizableText color="$color.onAccent" opacity={0.7}>
                Carregando
              </SizableText>
            </XStack>
          ) : (
            'Carregando'
          )}
        </ActionButton>
      </DemoRow>

      <DemoRow>
        {(Object.keys(HEIGHTS) as (keyof typeof HEIGHTS)[]).map((size) => (
          <YStack key={size} alignItems="center" gap="$space.s2">
            <ActionButton height={HEIGHTS[size]} onPress={() => {}}>
              {size} {HEIGHTS[size]}
            </ActionButton>
            <Meta>{size}</Meta>
          </YStack>
        ))}
      </DemoRow>

      <DemoRow>
        <ActionButton
          height={HEIGHTS.lg}
          width="100%"
          icon={<Wrench size={18} color="#1A1505" strokeWidth={2} />}
          onPress={() => {}}
        >
          <SizableText color="$color.onAccent" fontVariant={['tabular-nums']}>
            Largura total · 04:35 · 128
          </SizableText>
        </ActionButton>
      </DemoRow>
    </Section>
  );
}