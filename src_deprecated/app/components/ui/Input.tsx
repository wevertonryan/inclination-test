/**
 * Campo de texto (`DESIGN.md` §6.1, §7.6).
 *
 * Wrapper fino sobre o `Input` do Tamagui. §7.6 diz que "a UI kit faz os dois" —
 * erro em `danger` e foco em `accent` — e que o `padding 12/14` do §6.1 entra em
 * `styled`. A forma aqui é a mesma que a galeria de design já provou em
 * `design/FormSection.tsx`, porque aquele arquivo é a validação viva do §6.1.
 *
 * ## Erro ganha do foco
 *
 * §6.1: focado vira borda `accent` **desde que não haja erro**. Com erro, a borda
 * `danger` manda e o fundo vai para `dangerSoft`. Isso é um `focusStyle` dentro da
 * variante `invalid`, e não um `if` no componente: se o foco fosse resolvido no
 * corpo, o `focusStyle` do Tamagui entraria **depois** e viraria a borda de âmbar
 * por cima do erro.
 *
 * ## A tipografia vai escrita à mão, e `fontFamily` não entra
 *
 * O Tamagui só converte `fontFamily` numa família real quando o token de fonte tem
 * um mapa `face`, e o deste projeto não tem (§2 deixa a família indefinida para o
 * Tamagui usar a fonte da plataforma). Num `SizableText` isso passa, porque o
 * componente decompõe o token. Num `Input` o objeto chega ao `TextInput` nativo e o
 * Android quebra com *"cannot be cast to java.lang.String"*. Ver a nota completa em
 * `design/FormSection.tsx`.
 */

import { Input as TamaguiInput } from '@tamagui/input';
import { YStack } from '@tamagui/stacks';
import { SizableText } from '@tamagui/text';
import { styled } from '@tamagui/web';
import type { LucideIcon } from 'lucide-react-native';

import { colors, iconSize, layout, radii, spacing } from '../../../style/app';

const Field = styled(TamaguiInput, {
  name: 'InputField',

  height: layout.touchTarget,
  paddingVertical: spacing.s14,
  paddingHorizontal: spacing.s4,
  borderRadius: radii.md,
  borderWidth: 1,
  borderColor: '$color.border',
  backgroundColor: '$color.bgInput',
  color: '$color.text',

  // `fonts.body` de `tamagui.config.ts`, escrito por extenso — ver a nota.
  fontSize: 14,
  lineHeight: 20,
  fontWeight: '400',

  focusStyle: {
    borderColor: '$color.borderColorFocus',
  },

  variants: {
    invalid: {
      true: {
        borderColor: '$color.danger',
        backgroundColor: '$color.dangerSoft',
        // Com erro presente, quem manda é o `danger` — inclusive no foco.
        focusStyle: { borderColor: '$color.danger' },
      },
    },
  } as const,
});

/** O `Icon` fica sobre o campo, e o campo cede o espaço para ele. */
const WITH_ICON_PADDING = spacing.s7 + spacing.s2;

export interface InputProps {
  label?: string;
  placeholder?: string;
  /** Ícone dentro do campo, à esquerda. */
  Icon?: LucideIcon;
  value: string;
  onChangeText: (value: string) => void;
  /** Mensagem de erro. A borda e o fundo mudam junto — §6.1. */
  error?: string | null;
  /** Chamado ao confirmar no teclado (`returnKeyType="done"`). */
  onSubmit?: () => void;
  testID?: string;
}

export function Input({
  label,
  placeholder,
  Icon,
  value,
  onChangeText,
  error = null,
  onSubmit,
  testID,
}: InputProps) {
  const invalid = error !== null && error !== '';

  return (
    <YStack gap={spacing.s2}>
      {label ? (
        <SizableText fontSize={13} lineHeight={18} fontWeight="600" color="$color.textMuted">
          {label}
        </SizableText>
      ) : null}

      {/* `relative` porque o ícone é irmão do campo, não filho: `TextInput` com
          filho não mede o placeholder do mesmo jeito nos dois sistemas. */}
      <YStack>
        {Icon ? (
          <YStack
            position="absolute"
            left={spacing.s4}
            top={0}
            bottom={0}
            justifyContent="center"
            zIndex={1}
            pointerEvents="none"
          >
            <Icon size={iconSize.md} color={colors.textFaint} strokeWidth={2} />
          </YStack>
        ) : null}

        <Field
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="$color.textFaint"
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          invalid={invalid}
          paddingLeft={Icon ? WITH_ICON_PADDING : spacing.s4}
          accessibilityLabel={label ?? placeholder}
          testID={testID}
        />
      </YStack>

      {invalid ? (
        <SizableText
          fontSize={11}
          lineHeight={15}
          fontWeight="700"
          // A mensagem não pode ser só cor (§8). O `Input` carrega o
          // `accessibilityLabel`; quem fala o erro é este texto, com `alert`.
          color="$color.danger"
          accessibilityRole="alert"
          testID={testID ? `${testID}-error` : undefined}
        >
          {error}
        </SizableText>
      ) : null}
    </YStack>
  );
}

export default Input;