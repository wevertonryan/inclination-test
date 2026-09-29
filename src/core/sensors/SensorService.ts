import { DeviceMotion, type DeviceMotionMeasurement } from 'expo-sensors';
import type { MotionSample, Vector3 } from '../types';

export interface SensorServiceOptions {
  updateIntervalMs?: number;
}

export interface SensorService {
  start(onSample: (sample: MotionSample) => void): Promise<void>;
  stop(): void;
  isAvailable(): Promise<boolean>;
}

type AxisEvent = { x: number; y: number; z: number; timestamp: number } | null;
type RotationEvent = { alpha: number; beta: number; gamma: number; timestamp: number } | null;

function toVector3(axis: AxisEvent): Vector3 {
  if (!axis) {
    return { x: 0, y: 0, z: 0 };
  }
  return { x: axis.x, y: axis.y, z: axis.z };
}

function toRotationVector(rotation: RotationEvent): Vector3 {
  if (!rotation) {
    return { x: 0, y: 0, z: 0 };
  }
  return { x: rotation.alpha, y: rotation.beta, z: rotation.gamma };
}

export function normalizeSample(measurement: DeviceMotionMeasurement): MotionSample {
  return {
    accelerationIncludingGravity: toVector3(measurement.accelerationIncludingGravity),
    rotationRate: toRotationVector(measurement.rotationRate),
    rotation: toRotationVector(measurement.rotation),
    timestamp: measurement.accelerationIncludingGravity?.timestamp ?? Date.now(),
  };
}

export function createSensorService(options: SensorServiceOptions = {}): SensorService {
  const updateIntervalMs = options.updateIntervalMs ?? 1000 / 60;
  let subscription: ReturnType<typeof DeviceMotion.addListener> | null = null;

  const stop = (): void => {
    subscription?.remove();
    subscription = null;
  };

  return {
    async start(onSample: (sample: MotionSample) => void): Promise<void> {
      const available = await DeviceMotion.isAvailableAsync();
      if (!available) {
        throw new Error('DeviceMotion indisponível neste dispositivo');
      }
      stop();
      DeviceMotion.setUpdateInterval(updateIntervalMs);
      subscription = DeviceMotion.addListener((measurement) => {
        onSample(normalizeSample(measurement));
      });
    },
    stop,
    isAvailable(): Promise<boolean> {
      return DeviceMotion.isAvailableAsync();
    },
  };
}
