import { toAngles, toSignedAngles } from '../core/processing/AngleConverter';
import type { MotionSample, Vector3 } from '../core/types';

const G = 9.81;

// O conversor trabalha com `up = −gravity`, então montar a amostra a partir do
// vetor "para cima" deixa cada caso legível: qual componente está em +G indica
// para que lado o celular tombou.
function sample(up: Partial<Vector3>): MotionSample {
  const vector = { x: 0, y: 0, z: G, ...up };
  return {
    accelerationIncludingGravity: { x: -vector.x, y: -vector.y, z: -vector.z },
    rotationRate: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    timestamp: 0,
  };
}

function rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// Adernada: up = (−sen, 0, cos) → roll = deg, trim = 0.
function rollSample(deg: number): MotionSample {
  return sample({ x: -Math.sin(rad(deg)) * G, z: Math.cos(rad(deg)) * G });
}

// Inclinação longitudinal: up = (0, sen, cos) → trim = deg, roll = 0.
function trimSample(deg: number): MotionSample {
  return sample({ y: Math.sin(rad(deg)) * G, z: Math.cos(rad(deg)) * G });
}

describe('toSignedAngles', () => {
  it('devolve 0/0 com o celular deitado (tela para cima)', () => {
    const angles = toSignedAngles(rollSample(0));

    expect(angles.roll).toBeCloseTo(0, 6);
    expect(angles.trim).toBeCloseTo(0, 6);
  });

  it('devolve 0/0 quando a amostra não tem gravidade alguma', () => {
    const semGravidade: MotionSample = {
      ...rollSample(0),
      accelerationIncludingGravity: { x: 0, y: 0, z: 0 },
    };

    expect(toSignedAngles(semGravidade)).toEqual({ roll: 0, trim: 0 });
  });
});

describe('toAngles', () => {
  it('retorna roll 0 e trim 0 com o celular deitado (tela para cima)', () => {
    const angles = toAngles(rollSample(0));

    expect(angles.roll).toBeCloseTo(0, 6);
    expect(angles.trim).toBeCloseTo(0, 6);
  });

  it('mantém o sinal do roll para os dois lados', () => {
    expect(toAngles(rollSample(-90)).roll).toBeCloseTo(-90, 6);
    expect(toAngles(rollSample(90)).roll).toBeCloseTo(90, 6);
    expect(toAngles(rollSample(-20)).roll).toBeCloseTo(-20, 6);
    expect(toAngles(rollSample(20)).roll).toBeCloseTo(20, 6);
  });

  it('mantém o sinal do trim para os dois sentidos', () => {
    expect(toAngles(trimSample(90)).trim).toBeCloseTo(90, 6);
    expect(toAngles(trimSample(-90)).trim).toBeCloseTo(-90, 6);
    expect(toAngles(trimSample(-15)).trim).toBeCloseTo(-15, 6);
  });

  it('preserva a direção depois de subtrair a calibração com sinal', () => {
    // Zero calibrado com o celular adernado para −20°: ±10° em torno desse zero
    // têm de sair com sinais opostos.
    const zero = { roll: -20, trim: 0 };

    expect(toAngles(rollSample(-10), zero).roll).toBeCloseTo(10, 6);
    expect(toAngles(rollSample(-30), zero).roll).toBeCloseTo(-10, 6);
  });

  it('envolve o roll em (−180, 180] pelo caminho mais curto', () => {
    // 179,9° e −179,9° são a mesma atitude: o resíduo precisa dar 0,2°, não 358,2°.
    expect(toSignedAngles(rollSample(179.9)).roll).toBeCloseTo(179.9, 3);
    expect(toSignedAngles(rollSample(-179.9)).roll).toBeCloseTo(-179.9, 3);

    expect(toAngles(rollSample(179.9), { roll: -179.9, trim: 0 }).roll).toBeCloseTo(-0.2, 3);
    expect(toAngles(rollSample(-179.9), { roll: 179.9, trim: 0 }).roll).toBeCloseTo(0.2, 3);
  });

  it('mantém +180 como limite superior do roll', () => {
    expect(toAngles(rollSample(0), { roll: 180, trim: 0 }).roll).toBeCloseTo(180, 6);
  });

  it('satura o trim em ±90', () => {
    expect(toAngles(trimSample(90), { roll: 0, trim: -90 }).trim).toBeCloseTo(90, 6);
    expect(toAngles(trimSample(-90), { roll: 0, trim: 90 }).trim).toBeCloseTo(-90, 6);
  });

  it('nunca deixa os ângulos fora da faixa com sinal', () => {
    for (let deg = -180; deg <= 180; deg += 5) {
      const { roll, trim } = toAngles(rollSample(deg), { roll: 37, trim: 0 });
      expect(roll).toBeGreaterThanOrEqual(-180);
      expect(roll).toBeLessThanOrEqual(180);
      expect(trim).toBeGreaterThanOrEqual(-90);
      expect(trim).toBeLessThanOrEqual(90);
    }
  });
});