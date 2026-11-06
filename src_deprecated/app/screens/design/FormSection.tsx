/**
 * Formulários: `Input`, `Label`, `Switch`, `Checkbox`, `RadioGroup`, `Slider`,
 * `Progress`. É aqui que a galeria responde à pergunta que interessa — o app tem
 * `Input` (§6.1) e **nada** dos outros seis.
 *
 * O que muda o julgamento:
 *
 * - **`Input` cabe.** O `Input` nativo é um `TextInput` com as props do app
 *   (`value`, `onChangeText`, `placeholder`, `disabled`). O `padding 12/14` do
 *   §6.1 e a borda de `danger` com erro entram em `styled`.
 * - **`Slider` não substitui o `Gauge`.** O `Gauge` do §6.3 é um arco SVG com
 *   faixa entre mínimo e máximo e dois indicadores; o `Slider` é uma régua reta.
 *   Serve para ajuste fino num formulário, não para leitura.
 * - **`RadioGroup` não substitui o `FilterChips`.** O filtro de período do §6.3
 *   é multi-seleção; `RadioGroup` é escolha única. São widgets diferentes.
 * - **`Switch`, `Checkbox` e `Progress` não têm lugar hoje** — e é isso que a
 *   galeria está aqui para mostrar: o que o kit oferece que o app não usa.
 */

import { useState } from 'react';
import { Checkbox } from '@tamagui/checkbox';
import { Input } from '@tamagui/input';
import { Label } from '@tamagui/label';
import { Progress } from '@tamagui/progress';
import { RadioGroup } from '@tamagui/radio-group';
import { Slider } from '@tamagui/slider';
import { Switch } from '@tamagui/switch';
import { XStack, YStack } from '@tamagui/stacks';
import { SizableText } from '@tamagui/text';
import { styled } from '@tamagui/web';
import { Check } from 'lucide-react-native';

import { colors } from '../../../style/app';
import { DemoRow, Section } from './Section';

/** `Input` do §6.1: `bgInput`, borda `border`, `radius.md`, `padding 12/14`.
 *  Focado → borda `accent`, **desde que não haja erro**; com erro a borda
 *  `danger` manda e o fundo vai para `dangerSoft`.
 *
 *  ## Por que a tipografia é escrita à mão, e não `fontFamily: '$font.body'`
 *
 *  Porque o Tamagui só converte `fontFamily` numa família real quando o token de
 *  fonte tem um mapa `face`, e o deste projeto **não tem** — §2 deixa a família
 *  indefinida de propósito, para o Tamagui usar a fonte da plataforma em vez de
 *  tentar carregar uma. Sem `face`, o token cru: o `getSplitStyles` nativo
 *  encontra `style.fontFamily` preenchido, chama `getFont()` para achar `face`,
 *  não acha, e segue adiante com o objeto inteiro
 *  (`{ fontSize, lineHeight, fontWeight }`).
 *
 *  Num `SizableText` isso não aparece, porque o componente é de texto e o
 *  Tamagui decompõe o token. Num `Input` o objeto chega ao `TextInput` nativo e
 *  o Android quebra:
 *
 *  > Erro while updating property 'fontFamily' of a view managed by:
 *  > AndroidTextInput with.facebook.react.bridge.ReadAbleNativeMap cannot be
 *  > cast to java.lang.String
 *
 *  Então aqui os três valores de §2.1 vão explícitos, e é a única coisa que o
 *  `Input` aceita. `ui/Input.tsx` do §6.1 precisa do mesmo cuidado. */
const Field = styled(Input, {
  name: 'Field',

  height: 44,
  paddingHorizontal: '$space.s4',
  paddingVertical: '$space.s14',
  borderRadius: '$radius.md',
  borderWidth: 1,
  borderColor: '$color.border',
  backgroundColor: '$color.bgInput',
  color: '$color.text',
  // `fonts.body` de `tamagui.config.ts`, escrito por extenso.
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
        // O foco não pode virar a borda para `accent` com erro presente: §6.1
        // diz que com erro quem manda é o `danger`.
        focusStyle: { borderColor: '$color.danger' },
      },
    },
  } as const,
})

export function FormSection() {
  const [title, setTitle] = useState('');
  const [auto, setAuto] = useState(true);
  const [terms, setTerms] = useState(false);
  const [period, setPeriod] = useState('7');
  const [opening, setOpening] = useState([42]);

  return (
    <>
      <Section
        title="Input e Label"
        note="§6.1 — bgInput mais fundo que o card · foco = borda accent · erro = danger manda sobre o foco"
      >
        <YStack gap="$space.s2">
          <Label htmlFor="titulo" fontSize={13} lineHeight={18} fontWeight="600" color="$color.text">
            Título do registro
          </Label>
          <Field
            id="titulo"
            value={title}
            onChangeText={setTitle}
            placeholder="Prova de Mar — Convés"
          />
        </YStack>

        <YStack gap="$space.s2">
          <Label htmlFor="erro" fontSize={13} lineHeight={18} fontWeight="600" color="$color.text">
            Data de início
          </Label>
          <Field
            id="erro"
            invalid
            defaultValue="31/02/2026"
            placeholder="dd/mm/aaaa"
            keyboardType="numeric"
          />
          <SizableText fontSize={11} lineHeight={15} fontWeight="700" color="$color.danger">
            Data inválida — dia 31 não existe em fevereiro.
          </SizableText>
        </YStack>
      </Section>

      <Section
        title="Switch e Checkbox"
        note="não têm equivalente no app hoje — Settings é a tela que os receberia"
      >
        <DemoRow>
          <Toggle
            label="Calibração automática"
            hint="ligar ao abrir o app"
            control={
              <Switch checked={auto} onCheckedChange={setAuto} size="$md">
                <Switch.Thumb
                  backgroundColor="$color.text"
                  borderRadius="$radius.pill"
                />
              </Switch>
            }
          />
          <Toggle
            label="Vibração"
            hint="§8 — fora do MVP"
            control={
              <Switch size="$md" disabled>
                <Switch.Thumb backgroundColor="$color.textFaint" borderRadius="$radius.pill" />
              </Switch>
            }
          />
        </DemoRow>

        <YStack gap="$space.s3">
          <Checkbox
            id="termos"
            checked={terms}
            // `CheckedState` é `boolean | 'indeterminate'` — o terceiro estado
            // existe para "marcado por partly" e não cabe num `boolean` de
            // estado. A conversão é explícita para o cast não ficar solto.
            onCheckedChange={(checked) => setTerms(checked === true)}
          >
            <Checkbox.Indicator
              backgroundColor="$color.accent"
              borderColor="$color.border"
              borderRadius={4}
              borderWidth={1}
            >
              {terms ? <Check size={14} color={colors.onAccent} strokeWidth={3} /> : null}
            </Checkbox.Indicator>
            <Label
              htmlFor="termos"
              fontSize={14} lineHeight={20} fontWeight="400"
              color="$color.text"
              paddingLeft="$space.s3"
            >
              Registrar automaticamente ao abrir
            </Label>
          </Checkbox>

          <Checkbox id="termos2" disabled>
            <Checkbox.Indicator
              backgroundColor="transparent"
              borderColor="$color.border"
              borderRadius={4}
              borderWidth={1}
            />
            <Label
              htmlFor="termos2"
              fontSize={14} lineHeight={20} fontWeight="400"
              color="$color.textFaint"
              paddingLeft="$space.s3"
            >
              Sincronizar com a nuvem (desabilitado)
            </Label>
          </Checkbox>
        </YStack>
      </Section>

      <Section
        title="RadioGroup"
        note="escolha única — o filtro de período do FilterChips é multi-seleção, então não é substituto"
      >
        <RadioGroup value={period} onValueChange={setPeriod} gap="$space.s3">
          {[
            { value: '1', label: 'Hoje' },
            { value: '7', label: '7 dias' },
            { value: '30', label: '30 dias' },
          ].map(({ value, label }) => (
            <XStack key={value} alignItems="center" gap="$space.s3" minHeight={44}>
              <RadioGroup.Item
                value={value}
                borderColor="$color.border"
                backgroundColor="$color.bgInput"
                borderRadius="$radius.pill"
                borderWidth={1}
                size="$md"
              >
                <RadioGroup.Indicator />
              </RadioGroup.Item>
              <Label htmlFor={value} fontSize={14} lineHeight={20} fontWeight="400" color="$color.text">
                {label}
              </Label>
            </XStack>
          ))}
        </RadioGroup>
      </Section>

      <Section
        title="Slider"
        note="ajuste fino horizontal — não substitui o Gauge do §6.3, que é arco SVG com faixa e dois indicadores"
      >
        <YStack gap="$space.s3" width="100%">
          <XStack justifyContent="space-between">
            <SizableText fontSize={13} lineHeight={18} fontWeight="600" color="$color.text">
              Abertura alvo
            </SizableText>
            <SizableText
              fontSize={13} lineHeight={18} fontWeight="600"
              color="$color.accent"
              fontVariant={['tabular-nums']}
            >
              {opening[0]}°
            </SizableText>
          </XStack>

          <Slider
            width="100%"
            min={0}
            max={90}
            step={1}
            value={opening}
            onValueChange={setOpening}
          >
            <Slider.Track
              height={8}
              borderRadius="$radius.pill"
              backgroundColor="$color.bgInput"
            >
              <Slider.TrackActive backgroundColor="$color.accent" borderRadius="$radius.pill" />
            </Slider.Track>
            <Slider.Thumb
              size="$xl"
              backgroundColor="$color.accent"
              borderRadius="$radius.pill"
            />
          </Slider>

          <Slider width="100%" min={0} max={90} step={1} defaultValue={[30]} disabled>
            <Slider.Track
              height={8}
              borderRadius="$radius.pill"
              backgroundColor="$color.bgInput"
            >
              <Slider.TrackActive
                backgroundColor="$color.textFaint"
                borderRadius="$radius.pill"
              />
            </Slider.Track>
            <Slider.Thumb
              size="$xl"
              backgroundColor="$color.textFaint"
              borderRadius="$radius.pill"
            />
          </Slider>
        </YStack>
      </Section>

      <Section
        title="Progress"
        note="candidato ao progresso da calibração — hoje o app não mostra nenhum"
      >
        <YStack gap="$space.s4" width="100%">
          {[0.35, 0.7, 1].map((value) => (
            <YStack key={value} gap="$space.s2">
              <XStack justifyContent="space-between">
                <SizableText fontSize={11} lineHeight={15} fontWeight="700" color="$color.textMuted">
                  {value === 1 ? 'Concluído' : `Calibrando eixo ${value < 0.5 ? 'X' : 'Y'}`}
                </SizableText>
                <SizableText
                  fontSize={11} lineHeight={15} fontWeight="700"
                  color="$color.text"
                  fontVariant={['tabular-nums']}
                >
                  {Math.round(value * 100)}%
                </SizableText>
              </XStack>
              <Progress
                value={value}
                height={8}
                borderRadius="$radius.pill"
                backgroundColor="$color.bgInput"
              >
                <Progress.Indicator
                  backgroundColor={value === 1 ? '$color.ok' : '$color.accent'}
                  borderRadius="$radius.pill"
                />
              </Progress>
            </YStack>
          ))}
        </YStack>
      </Section>
    </>
  );
}

/** Par rótulo/controle do §6.4 — todo componente interativo declara papel,
 *  rótulo e estado; aqui o rótulo é texto e o controle traz o seu. */
function Toggle({
  label,
  hint,
  control,
}: {
  label: string;
  hint: string;
  control: React.ReactNode;
}) {
  return (
    <YStack
      flexGrow={1}
      minWidth={200}
      padding="$space.s4"
      gap="$space.s3"
      borderRadius="$radius.md"
      borderWidth={1}
      borderColor="$color.border"
      backgroundColor="$color.bgInput"
    >
      <XStack alignItems="center" justifyContent="space-between">
        <SizableText fontSize={13} lineHeight={18} fontWeight="600" color="$color.text">
          {label}
        </SizableText>
        {control}
      </XStack>
      <SizableText fontSize={11} lineHeight={15} fontWeight="700" color="$color.textMuted">
        {hint}
      </SizableText>
    </YStack>
  );
}