/**
 * `Select` e `Toast` — os dois que dependem de `@tamagui/portal`, e por isso os
 * dois que precisam de mais prova.
 *
 * ## Select
 *
 * Serve, com uma ressalva: o `Select` nativo é um `Picker` do próprio
 * `ScrollView`, então **abre a lista inteira de uma vez**, sem overlay nem
 * busca. É a peça certa para 3 a 8 opções — o "Qual é o seu equipamento?" do
 * onboarding, a unidade das configurações. Acima disso falta busca, e o `Select`
 * não tem.
 *
 * `Select.Trigger` é um `ListItem` por baixo, e herda de `ListItem` a
 * `backgroundColor: $background` — por isso o `TRIGGER_STYLE` abaixo sobrescreve.
 *
 * ## Toast
 *
 * O encaixe mais forte de todos, porque o app precisa de feedback de uma coisa
 * que ainda não tem: o resultado de uma calibração. §7.5 mede os três eixos a
 * 60 Hz e a `CalibrationScreen` não mostra se passaram ou falharam. Um toast é a
 * forma mais barata de fechar essa lacuna.
 *
 * ## O import está no lugar certo?
 *
 * Não, e é o tipo de coisa que só aparece quando se abre o pacote.
 * `@tamagui/toast` exporta a API **depreciada** — `ToastProvider`,
 * `ToastViewport`, `useToastController` — em que `show()` vive num contexto e
 * devolve estado a cada toast. A API atual é composável, com o estado num
 * observer fora do React, e sai de **`@tamagui/toast/v2`**:
 *
 * ```ts
 * import { toast, Toaster } from '@tamagui/toast/v2'
 * ```
 *
 * `toast` é um singleton no estilo do Sonner: `toast.success(...)`,
 * `toast.error(...)`, `toast.dismiss()`, `toast.promise(...)` — e nada disso
 * precisa de hook, então dá para chamar de um `catch` ou de um listener de
 * sensor. É essa forma que o app quer.
 *
 * O preço continua sendo a montagem: `<Toaster />` precisa ficar **na raiz**,
 * sob o `<PortalProvider>` do `App.tsx`. Sem ele `toast.success()` não tem onde
 * desenhar e nada aparece, sem erro.
 */

import { useState } from 'react';
import { Select } from '@tamagui/select';
import { toast } from '@tamagui/toast/v2';
import { Check, ChevronDown } from 'lucide-react-native';
import { XStack, YStack } from '@tamagui/stacks';
import { SizableText } from '@tamagui/text';

import { colors, iconSize } from '../../../style/app';
import { Section } from './Section';

const EQUIPMENTS = [
  { value: 'none', label: 'Nenhum' },
  { value: 'fumaca', label: 'Fumaca — sensor 9169014' },
  { value: 'passador', label: 'Passador — sensor 9169038' },
  { value: 'outro', label: 'Outro' },
];

const UNITS = [
  { value: 'graus', label: 'Graus (°)' },
  { value: 'percentual', label: 'Porcentagem (%)' },
  { value: 'milimetro', label: 'Milímetro' },
];

/**
 * `input` do §6.1: `bgInput`, borda `border`, `radius.md`, 44 de altura.
 *
 * O `size="$touch"` do `Select` importa: o `defaultVariants` do Tamagui é
 * `size: '$2'`, que não existe nos tokens deste projeto, e aí o `minHeight`
 * resolve `undefined`. `size` do Tamagui é a altura do controle — e `$touch` (44)
 * é exatamente a altura do `Input` do §6.1.
 */
const TRIGGER_STYLE = {
  height: 44,
  paddingHorizontal: '$space.s4',
  borderRadius: '$radius.md',
  borderWidth: 1,
  borderColor: '$color.border',
  backgroundColor: '$color.bgInput',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
} as const;

export function OverlaySection() {
  const [equipment, setEquipment] = useState<string>('none');
  const [unit, setUnit] = useState<string | undefined>(undefined);

  return (
    <>
      <Section
        title="Select"
        note="§6.1 — o alvo é um input; Value mostra o texto e ChevronDown fica à direita"
      >
        <YStack gap="$space.s4" width="100%">
          <YStack gap="$space.s2">
            <SizableText fontSize={13} lineHeight={18} fontWeight="600" color="$color.text">
              Qual é o seu equipamento?
            </SizableText>
            <SelectField
              value={equipment}
              onValueChange={setEquipment}
              options={EQUIPMENTS}
              placeholder="Escolha uma opção"
            />
          </YStack>

          <YStack gap="$space.s2">
            <SizableText fontSize={13} lineHeight={18} fontWeight="600" color="$color.text">
              Unidade de leitura
            </SizableText>
            <SelectField
              value={unit}
              onValueChange={setUnit}
              options={UNITS}
              placeholder="Padrão: graus"
            />
          </YStack>

          <SizableText fontSize={11} lineHeight={15} fontWeight="700" color="$color.textMuted">
            O segundo está vazio de propósito: `Value` sem `value` mostra só o
            placeholder, que é texto comum e some quando o campo é preenchido.
          </SizableText>
        </YStack>
      </Section>

      <Section
        title="Toast"
        note="`toast` é singleton — precisa do <Toaster /> na raiz, sob o PortalProvider"
      >
        <YStack gap="$space.s4" width="100%">
          <XStack gap="$space.s3" flexWrap="wrap">
            <ToastTrigger
              label="Toast de sucesso"
              tone={colors.ok}
              onPress={() =>
                toast.success('Calibração concluída', {
                  description: 'X, Y e Z dentro de ± 0,5°',
                  duration: 2600,
                })
              }
            />
            <ToastTrigger
              label="Toast de erro"
              tone={colors.danger}
              onPress={() =>
                toast.error('Eixo Y reprovado', {
                  description: 'Leitura 4,2° — a tolerância é ± 0,5°',
                  duration: 3000,
                })
              }
            />
            <ToastTrigger
              label="Toast informativo"
              tone={colors.accent}
              onPress={() =>
                toast.info('Leitura ao vivo', {
                  description: 'Amostras descartadas com o app em segundo plano',
                  duration: 2600,
                })
              }
            />
          </XStack>

          <SizableText fontSize={11} lineHeight={15} fontWeight="700" color="$color.textMuted">
            O de erro é o caso real: §7.5 já tem os três eixos medidos, e o app
            não tem como avisar que um deles passou do limite.
          </SizableText>
        </YStack>
      </Section>
    </>
  );
}

/**
 * `Select` repetido duas vezes acima. O `index` do `Select.Item` é obrigatório —
 * é por ele que o `Value` encontra o texto do item selecionado, então a ordem
 * dos filhos tem que ser a mesma dos valores.
 */
function SelectField({
  value,
  onValueChange,
  options,
  placeholder,
}: {
  value: string | undefined;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange} size="$touch" zIndex={200}>
      <Select.Trigger {...TRIGGER_STYLE}>
        <Select.Value placeholder={placeholder} />
        <ChevronDown size={iconSize.sm} color={colors.textMuted} strokeWidth={2} />
      </Select.Trigger>

      <Select.Content>
        <Select.Viewport
          padding="$space.s2"
          borderRadius="$radius.md"
          borderWidth={1}
          borderColor="$color.border"
          backgroundColor="$color.bgCard"
        >
          <Select.Group>
            {options.map((option, index) => (
              <Select.Item
                key={option.value}
                value={option.value}
                index={index}
                borderRadius="$radius.sm"
                paddingHorizontal="$space.s3"
                paddingVertical="$space.s3"
                pressStyle={{ backgroundColor: '$color.backgroundPress' }}
              >
                <Select.ItemText fontSize={14} lineHeight={20} fontWeight="400" color="$color.text">
                  {option.label}
                </Select.ItemText>
                <Select.ItemIndicator>
                  <Check size={16} color={colors.accent} strokeWidth={3} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Group>
        </Select.Viewport>
      </Select.Content>
    </Select>
  );
}

function ToastTrigger({
  label,
  tone,
  onPress,
}: {
  label: string;
  tone: string;
  onPress: () => void;
}) {
  return (
    <YStack
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      minHeight={44}
      paddingHorizontal="$space.s4"
      paddingVertical="$space.s3"
      borderRadius="$radius.md"
      borderWidth={1}
      borderColor={tone}
      backgroundColor="$color.bgInput"
      pressStyle={{
        backgroundColor: '$color.backgroundPress',
        scale: 0.98,
      }}
    >
      <SizableText fontSize={13} lineHeight={18} fontWeight="600" color={tone}>
        {label}
      </SizableText>
    </YStack>
  );
}