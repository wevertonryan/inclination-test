/**
 * Botão redondo de ícone (`DESIGN.md` §6.1).
 *
 * `60` é o dos botões flutuantes (gravar, calibrar, salvar, cancelar);
 * `48` para ações de header. Ambos acima do alvo mínimo de 44 (§8).
 * O `pressed` faz `scale 0.94` sem transição de cor — feedback tátil imediato.
 */

import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { colors, elevation, iconSize, onColor, radii } from '../../../style/app';
import { PressableScale } from './PressableScale';

export type IconButtonSize = 48 | 60;
export type IconButtonTone = 'neutral' | 'accent' | 'ok' | 'danger';

export interface IconButtonProps {
  Icon: LucideIcon;
  /** Obrigatório: ícone nunca é o único sinal (§5.4). */
  accessibilityLabel: string;
  onPress?: () => void;
  size?: IconButtonSize;
  tone?: IconButtonTone;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const TONE: Record<IconButtonTone, { background: string; border: string; tint: string }> = {
  neutral: { background: colors.bgCard, border: colors.border, tint: colors.text },
  accent: { background: colors.accent, border: colors.accent, tint: onColor.accent },
  ok: { background: colors.ok, border: colors.ok, tint: onColor.ok },
  danger: { background: colors.danger, border: colors.danger, tint: onColor.danger },
};

export function IconButton({
  Icon,
  accessibilityLabel,
  onPress,
  size = 48,
  tone = 'neutral',
  disabled = false,
  style,
  testID,
}: IconButtonProps) {
  const palette = TONE[tone];

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={[
        styles.base,
        {
          width: size,
          height: size,
          backgroundColor: palette.background,
          borderColor: palette.border,
        },
        tone !== 'neutral' && elevation[2],
        disabled && styles.disabled,
        style,
      ]}
    >
      <Icon size={iconSize.xxl} color={palette.tint} strokeWidth={2} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.45,
  },
});

export default IconButton;