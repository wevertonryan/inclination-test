export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface MotionSample {
  // Convenção expo-sensors/W3C: deitado (tela para cima) accelerationIncludingGravity ≈ (0, 0, -9.81)
  accelerationIncludingGravity: Vector3;
  rotationRate: Vector3;
  rotation: Vector3;
  timestamp: number;
}

export interface Angles {
  roll: number;
  trim: number;
}

export interface Calibration {
  roll: number;
  trim: number;
}
