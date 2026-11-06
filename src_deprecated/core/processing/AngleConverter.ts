import type { Angles, Calibration, MotionSample, Vector3 } from '../types';

const DEG_PER_RAD = 180 / Math.PI;
const TRIM_LIMIT = 90;

const ZERO_CALIBRATION: Calibration = { roll: 0, trim: 0 };

function magnitude(vector: Vector3): number {
  return Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
}

/** Envolve em (−180, 180], para a virada pela proa nao dar uma volta no mostrador. */
function wrap180(degrees: number): number {
  const wrapped = ((((degrees + 180) % 360) + 360) % 360) - 180;
  return wrapped <= -180 ? wrapped + 360 : wrapped;
}

/** Satura em [−90, 90]. */
function clampTrim(degrees: number): number {
  return Math.max(-TRIM_LIMIT, Math.min(TRIM_LIMIT, degrees));
}

/**
 * Converte a amostra filtrada em adernada (roll) e trim, em graus com sinal.
 *
 * A pose (roll, trim) produz um vetor de gravidade proporcional a
 * (tan roll, -tan trim, -1); aqui a conta e invertida com `atan2`, que le os
 * dois eixos de uma vez e mantem o resultado dentro das faixas do contrato.
 */
export function toAngles(sample: MotionSample, calibration?: Calibration): Angles {
  const offset = calibration ?? ZERO_CALIBRATION;
  const gravity = sample.accelerationIncludingGravity;

  if (magnitude(gravity) === 0) {
    return { roll: 0, trim: 0 };
  }

  // A convencao expo-sensors/W3C mede a gravidade para baixo, entao a
  // referencia "para cima" (up) e o vetor negado. Com o celular deitado, o
  // denominador -gravity.z e 9.81 e os dois angulos saem 0.
  //
  // Com a gravidade inteira no eixo Y (proa para cima ou para baixo) o eixo de
  // roll fica indeterminado e o atan2 devolveria 180. O contrato define 0.
  const rawRoll =
    gravity.x === 0 && gravity.z === 0 ? 0 : Math.atan2(gravity.x, -gravity.z) * DEG_PER_RAD;
  const rawTrim = Math.atan2(-gravity.y, -gravity.z) * DEG_PER_RAD;

  return {
    roll: wrap180(rawRoll - offset.roll),
    trim: clampTrim(rawTrim - offset.trim),
  };
}