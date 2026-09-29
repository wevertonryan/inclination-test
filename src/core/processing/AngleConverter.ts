import type { Angles, Calibration, MotionSample } from '../types';

const RAD_TO_DEG = 180 / Math.PI;
const ROLL_MAX = 180;
const TRIM_MAX = 90;

export interface SignedAngles {
  roll: number;
  trim: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function toSignedAngles(sample: MotionSample): SignedAngles {
  const gravity = sample.accelerationIncludingGravity;
  const up = { x: -gravity.x, y: -gravity.y, z: -gravity.z };
  const magnitude = Math.hypot(up.x, up.y, up.z);
  if (magnitude === 0) {
    return { roll: 0, trim: 0 };
  }
  const roll = Math.atan2(-up.x, up.z) * RAD_TO_DEG;
  const trim = Math.asin(clamp(up.y / magnitude, -1, 1)) * RAD_TO_DEG;
  return { roll, trim };
}

export function toAngles(
  sample: MotionSample,
  calibration: Calibration = { roll: 0, trim: 0 },
): Angles {
  const raw = toSignedAngles(sample);
  return {
    roll: clamp(Math.abs(raw.roll - calibration.roll), 0, ROLL_MAX),
    trim: clamp(Math.abs(raw.trim - calibration.trim), 0, TRIM_MAX),
  };
}
