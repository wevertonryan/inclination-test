/**
 * `Avatar` — o pacote mais órfão dos 17.
 *
 * O app não tem conta, não tem login e não tem foto: quem usa é a mesma pessoa,
 * no mesmo aparelho, o tempo todo. Não existe tela onde um avatar represente
 * algo. Ele está aqui porque a galeria precisa mostrar o pacote inteiro, e a
 * resposta honesta é "não tem lugar" — o que é informação, não omissão.
 *
 * O que a peça demonstra de útil: `Avatar.Fallback` só renderiza enquanto a
 * imagem **não** carregou (`imageLoadingStatus !== 'loaded'`), com `delayMs` para
 * não piscar em imagem que vem do cache. Esse padrão de "mostra o initials até a
 * foto chegar" é o que o app usaria se um dia houvesse usuário.
 */

import { Avatar } from '@tamagui/avatar';
import { User } from 'lucide-react-native';
import { XStack, YStack } from '@tamagui/stacks';
import { SizableText } from '@tamagui/text';

import { colors, iconSize } from '../../../style/app';
import { DemoRow, Section } from './Section';

export function IdentitySection() {
  return (
    <Section
      title="Avatar"
      note="sem lugar no app hoje — não há conta, login ou foto de usuário"
    >
      <DemoRow>
        {/* `size` aqui é token de `size`, então `$xl` dá 24px — a mesma
         *  escala de §5.2 que os ícones usam. */}
        <Avatar size="$xl" circular backgroundColor="$color.accentSoft">
          <Avatar.Fallback>
            <User size={iconSize.sm} color={colors.accent} strokeWidth={2} />
          </Avatar.Fallback>
        </Avatar>

        <Avatar size="$xxl" circular backgroundColor="$color.bgInput" borderWidth={1} borderColor="$color.border">
          <Avatar.Fallback>
            <SizableText fontSize={13} lineHeight={18} fontWeight="600" color="$color.text">
              MR
            </SizableText>
          </Avatar.Fallback>
        </Avatar>

        {/* Sem `src`, o status nunca chega a `loaded`, então o fallback é o que
         *  fica — é o comportamento esperado, não um estado quebrado. */}
        <Avatar size="$xxl" circular backgroundColor="$color.bgInput" borderWidth={1} borderColor="$color.border">
          <Avatar.Fallback delayMs={0}>
            <SizableText fontSize={13} lineHeight={18} fontWeight="600" color="$color.textFaint">
              ?
            </SizableText>
          </Avatar.Fallback>
        </Avatar>
      </DemoRow>

      <YStack gap="$space.s2" width="100%">
        <SizableText fontSize={11} lineHeight={15} fontWeight="700" color="$color.textMuted">
          O terceiro tem `delayMs={0}`: sem ele o fallback apareceria já no primeiro
          render. Com `src` de cache isso evita o piscar de "?" → foto.
        </SizableText>
      </YStack>
    </Section>
  );
}
