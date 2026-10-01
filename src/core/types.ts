export interface Vector3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface MotionSample {
  // Convenção expo-sensors/W3C: deitado (tela para cima) accelerationIncludingGravity ≈ (0, 0, -9.81)
  readonly accelerationIncludingGravity: Vector3;
  readonly rotationRate: Vector3;
  readonly rotation: Vector3;
  readonly timestamp: number;
}

export interface Angles {
  readonly roll: number;
  readonly trim: number;
}

export interface Calibration {
  readonly roll: number;
  readonly trim: number;
}
