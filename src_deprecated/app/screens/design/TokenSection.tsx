/**
 * Tokens vistos através do Tamagui — a página precisa mostrar a paleta **como o
 * Tamagui a entrega**, não como o `StyleSheet` a entrega.
 *
 * Cada amostra abaixo é uma referência `$group.name`. Se uma delas aparecesse
 * como texto em vez de cor, a referência não resolveu e o problema é do config,
 * não do componente — que é o motivo de a página existir.
 */

import { ScrollView } from '@tamagui/scroll-view';
import { XStack, YStack } from '@tamagui/stacks';
import { SizableText } from '@tamagui/text';

import { colors, elevation, radii, spacing, typography } from '../../../style/app';
import { Meta } from './Section';

type ColorToken = keyof typeof colors;

const SURFACES: { token: ColorToken; label: string }[] = [
  { token: 'bg', label: 'bg' },
  { token: 'bgElevated', label: 'bgElevated' },
  { token: 'bgCard', label: 'bgCard' },
  { token: 'bgInput', label: 'bgInput' },
];

const SEMANTIC: { token: ColorToken; label: string; note: string }[] = [
  { token: 'text', label: 'text', note: '≈14:1 · AAA' },
  { token: 'textMuted', label: 'textMuted', note: '≈5:1 · AA' },
  { token: 'textFaint', label: 'textFaint', note: 'só desabilitado' },
  { token: 'accent', label: 'accent', note: 'marca · ação primária' },
  { token: 'accentStrong', label: 'accentStrong', note: 'pressionado' },
  { token: 'ok', label: 'ok', note: 'calibrado · salvo' },
  { token: 'danger', label: 'danger', note: 'erro · excluir' },
  { token: 'rec', label: 'rec', note: 'gravar ≠ danger' },
];

const DOMAIN: { token: ColorToken; label: string }[] = [
  { token: 'roll', label: 'roll' },
  { token: 'trim', label: 'trim' },
  { token: 'chartGrid', label: 'chartGrid' },
  { token: 'chartAxis', label: 'chartAxis' },
];

const TYPES: { role: keyof typeof typography; sample: string }[] = [
  { role: 'display', sample: '04:35 · 128' },
  { role: 'title', sample: 'Medição' },
  { role: 'heading', sample: 'Informações' },
  { role: 'body', sample: 'Abertura em graus (máx − mín)' },
  { role: 'label', sample: 'Acelerômetro' },
  { role: 'caption', sample: 'Nº X Y Z' },
  { role: 'micro', sample: 'Calibração' },
];

const SPACES = ['s1', 's2', 's3', 's4', 's14', 's5', 's6', 's7', 's8'] as const;

const RADII = ['sm', 'md', 'lg', 'pill'] as const;

/**
 * Nome do papel → referência do token.
 *
 * **Não** é `fontFamily`, e sim `size` — o papel tipográfico. A diferença importa:
 * os tokens de fonte deste projeto têm `fontSize` mas não têm o sub-mapa `size`
 * que o Tamagui espera, então pedir `fontFamily="$font.display"` faz o
 * `getFontSizeToken` cair no branch `inSize ?? '$4'`, procurar `'$4'` entre
 * `sm/md/lg/xl/xxl/hero/touch`, não achar e **avisar a cada render**:
 *
 * > No font size found $4 undefined in size tokens […]
 *
 * `size` é o caminho certo: o papel também é o tamanho, e é por ele que a
 * galeria mostra a escala de §2. O mapa abaixo é a referência do token de cada
 * papel, com o nome escrito por extenso para o erro de digitação aparecer aqui.
 */
const TYPE_TOKENS = {
  display: '$font.display',
  title: '$font.title',
  heading: '$font.heading',
  body: '$font.body',
  label: '$font.label',
  caption: '$font.caption',
  micro: '$font.micro',
} as const satisfies Record<keyof typeof typography, string>;

const RADIUS_TOKENS = {
  sm: '$radius.sm',
  md: '$radius.md',
  lg: '$radius.lg',
  pill: '$radius.pill',
} as const satisfies Record<(typeof RADII)[number], string>;

/**
 * A amostra pinta com o **literal** do token, não com `$color.*`.
 *
 * Não é descuido: um token de cor do Tamagui só é resolvido dentro de uma
 * primitiva dele. Uma `View` do React Native não entende `$accent` e cairia no
 * cinza do sistema. Os literais vêm de `style/theme.ts`, que é a fachada que o
 * §7.6 autoriza justamente para o código que não é primitiva — o mesmo caminho
 * que o `Icon` do Lucide percorre no `NavBar`.
 */
function Swatch({
  value,
  label,
  note,
}: {
  value: string;
  label: string;
  note?: string;
}) {
  return (
    <YStack width={104} gap="$space.s2">
      <YStack
        height={44}
        borderRadius="$radius.sm"
        borderWidth={1}
        borderColor="$color.border"
        backgroundColor={value}
      />
      <SizableText fontSize={11} lineHeight={15} fontWeight="700" color="$color.text" numberOfLines={1}>
        {label}
      </SizableText>
      <Meta>{note ?? value}</Meta>
    </YStack>
  );
}

export function TokenSection() {
  return (
    <>
      <Block title="Superfície" note="§1.1 — os quatro degraus de fundo">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {SURFACES.map(({ token, label }) => (
            <Swatch key={token} value={colors[token]} label={label} />
          ))}
        </ScrollView>
      </Block>

      <Block title="Conteúdo e semântica" note="§1.2 — cor é canal de informação">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {SEMANTIC.map(({ token, label, note }) => (
            <Swatch key={token} value={colors[token]} label={label} note={note} />
          ))}
        </ScrollView>
      </Block>

      <Block title="Domínio" note="§1.3 — fixas, não acompanham o accent">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {DOMAIN.map(({ token, label }) => (
            <Swatch key={token} value={colors[token]} label={label} />
          ))}
        </ScrollView>
      </Block>

      <Block title="Tipografia" note="§2.1 — todo número com tabular-nums">
        <YStack gap={0}>
          {TYPES.map(({ role, sample }, index) => (
            <YStack
              key={role}
              paddingVertical="$space.s3"
              borderTopWidth={index === 0 ? 0 : 1}
              borderColor="$color.border"
              gap="$space.s1"
            >
              <SizableText
                size={TYPE_TOKENS[role]}
                color="$color.text"
                numberOfLines={1}
              >
                {sample}
              </SizableText>
              <Meta>{role}</Meta>
            </YStack>
          ))}
        </YStack>
      </Block>

      <Block title="Espaçamento" note="§3.1 — escala base 4, mais o s14 que §6.1/§6.2 exigem">
        <XStack alignItems="flex-end" gap="$space.s2">
          {SPACES.map((token) => (
            <YStack key={token} alignItems="center" gap="$space.s1" width={44}>
              <YStack
                width={spacing[token]}
                height={spacing[token]}
                borderRadius={2}
                backgroundColor="$color.accent"
              />
              <Meta>{token}</Meta>
              <Meta>{spacing[token]}</Meta>
            </YStack>
          ))}
        </XStack>
      </Block>

      <Block title="Raios e elevação" note="§3.2/§3.3 — o par elevation + shadow vai sempre junto">
        <XStack gap="$space.s5">
          {RADII.map((token) => (
            <YStack key={token} alignItems="center" gap="$space.s2">
              <YStack
                width={56}
                height={44}
                borderRadius={RADIUS_TOKENS[token]}
                backgroundColor="$color.bgElevated"
                borderWidth={1}
                borderColor="$color.border"
              />
              <Meta>{token}</Meta>
              <Meta>{radii[token]}</Meta>
            </YStack>
          ))}

          {([1, 2, 3] as const).map((level) => (
            <YStack key={level} alignItems="center" gap="$space.s2">
              <YStack
                width={56}
                height={44}
                borderRadius="$radius.md"
                backgroundColor="$color.bgElevated"
                {...elevation[level]}
              />
              <Meta>elev {level}</Meta>
            </YStack>
          ))}
        </XStack>
      </Block>
    </>
  );
}

/** Agrupador interno — o `Section` é a moldura da página, esta a da lista. */
function Block({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <YStack gap="$space.s2">
      <XStack alignItems="baseline" gap="$space.s3">
        <SizableText fontSize={13} lineHeight={18} fontWeight="600" color="$color.text">
          {title}
        </SizableText>
        {note ? <Meta>{note}</Meta> : null}
      </XStack>
      {children}
    </YStack>
  );
}