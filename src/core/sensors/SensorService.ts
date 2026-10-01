import { DeviceMotion } from 'expo-sensors';
import type { DeviceMotionMeasurement } from 'expo-sensors';
import type { MotionSample, Vector3 } from '../types';

const DEFAULT_UPDATE_INTERVAL_MS = 1000 / 60;

type Subscription = { remove: () => void };

type AxisTriple = { x: number; y: number; z: number } | null;

type EulerTriple = { alpha: number; beta: number; gamma: number } | null;

export interface SensorServiceOptions {
  updateIntervalMs?: number;
}

export interface SensorService {
  isAvailable(): Promise<boolean>;
  start(onSample: (sample: MotionSample) => void): Promise<void>;
  stop(): void;
}

function toVector3(axis: AxisTriple): Vector3 {
  if (axis === null) {
    return { x: 0, y: 0, z: 0 };
  }
  return { x: axis.x, y: axis.y, z: axis.z };
}

/** O expo nomeia a rotacao por alpha/beta/gamma, nao por x/y/z. */
function toEulerVector3(axes: EulerTriple): Vector3 {
  if (axes === null) {
    return { x: 0, y: 0, z: 0 };
  }
  return { x: axes.alpha, y: axes.beta, z: axes.gamma };
}

/**
 * Traduz o evento do expo-sensors na MotionSample que o FilterService consome.
 *
 * O expo expõe rotacao por alpha/beta/gamma e declara `acceleration` e
 * `rotationRate` como possivelmente nulos, entao cada campo vira um vetor novo
 * com x, y, z — o evento original nunca atravessa a fronteira, para uma
 * normalizacao errada aqui nao virar corrupcao duas etapas adiante.
 */
function toMotionSample(event: DeviceMotionMeasurement): MotionSample {
  const gravity = event.accelerationIncludingGravity;
  const sensorTimestamp = gravity.timestamp;

  return {
    accelerationIncludingGravity: toVector3(gravity),
    rotationRate: toEulerVector3(event.rotationRate),
    rotation: toEulerVector3(event.rotation),
    timestamp: Number.isFinite(sensorTimestamp) ? sensorTimestamp : Date.now(),
  };
}

/**
 * Assina o DeviceMotion e entrega amostras normalizadas.
 *
 * A taxa e fixada antes da assinatura: pedir o intervalo depois deixaria a
 * janela inicial da medicao na frequencia padrao da plataforma.
 */
export function createSensorService(options: SensorServiceOptions = {}): SensorService {
  const updateIntervalMs = options.updateIntervalMs ?? DEFAULT_UPDATE_INTERVAL_MS;

  let subscription: Subscription | null = null;

  const stop = (): void => {
    const current = subscription;
    subscription = null;
    if (current !== null) {
      current.remove();
    }
  };

  return {
    isAvailable: (): Promise<boolean> => DeviceMotion.isAvailableAsync(),

    start: async (onSample: (sample: MotionSample) => void): Promise<void> => {
      if (!(await DeviceMotion.isAvailableAsync())) {
        throw new Error('DeviceMotion indisponivel neste dispositivo');
      }

      stop();
      DeviceMotion.setUpdateInterval(updateIntervalMs);
      subscription = DeviceMotion.addListener((event) => {
        onSample(toMotionSample(event));
      });
    },

    stop,
  };
}