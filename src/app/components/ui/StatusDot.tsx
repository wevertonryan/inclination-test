/**
 * Ponto de status (`DESIGN.md` §6.1).
 *
 * Círculo 18px com ícone 14px dentro. Cinco estados, e cor nunca aparece
 * sozinha — cada um tem seu ícone (`§5.4`), então o status é legível sem cor.
 */

import { StyleSheet, View } from 'react-native';
import { Check, CircleHelp, TriangleAlert, X } from 'lucide-react-native';

import { colors, iconSize, onColor, radii } from '../../../style/app';
import { Spinner } from './Spinner';

export type StatusKind = 'ok' | 'uncalibrated' | 'unknown' | 'error' | 'calibrating';

export const STATUS_LABEL: Record<StatusKind, string> = {
  ok: 'Calibrado',
  uncalibrated: 'Não calibrado',
  unknown: 'Não identificado',
  error: 'Erro na calibragem',
  calibrating: 'Calibrando',
};

const PALETTE: Record<StatusKind, { background: string; tint: string }> = {
  ok: { background: colors.ok, tint: onColor.ok },
  uncalibrated: { background: colors.danger, tint: onColor.danger },
  error: { background: colors.danger, tint: onColor.danger },
  unknown: { background: colors.textMuted, tint: '#101828' },
  calibrating: { background: colors.accent, tint: onColor.accent },
};

export interface StatusDotProps {
  status: StatusKind;
  /** Sobrescreve o rótulo padrão quando a frase não basta. */
  accessibilityLabel?: string;
  size?: number;
}

export function StatusDot({
  status,
  accessibilityLabel,
  size = 18,
}: StatusDotProps) {
  const palette = PALETTE[status];
  const iconSizeValue = iconSize.sm;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? STATUS_LABEL[status]}
      style={[
        styles.dot,
        { width: size, height: size, borderRadius: radii.pill, backgroundColor: palette.background },
      ]}
    >
      {status === 'ok' ? (
        <Check size={iconSizeValue} color={palette.tint} strokeWidth={3} />
      ) : null}
      {status === 'uncalibrated' ? (
        <X size={iconSizeValue} color={palette.tint} strokeWidth={3} />
      ) : null}
      {status === 'error' ? (
        <TriangleAlert size={iconSizeValue} color={palette.tint} strokeWidth={3} />
      ) : null}
      {status === 'unknown' ? (
        <CircleHelp size={iconSizeValue} color={palette.tint} strokeWidth={3} />
      ) : null}
      {status === 'calibrating' ? <Spinner size={iconSize.sm} color={palette.tint} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default StatusDot;