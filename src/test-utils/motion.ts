/**
 * Fixtures e utilitários compartilhados pelos testes do pipeline do core.
 *
 * Este arquivo NÃO é uma suite de testes (jest.config.js ignora test-utils/).
 *
 * Princípio: nada aqui implementa a mesma conta que a aplicação faz.
 * `poseToGravity`, por exemplo, constrói o vetor gravidade de uma pose conhecida
 * usando tangente — enquanto o AngleConverter resolve a pose com atan2. Os testes
 * do round-trip ficam assim independentes da fórmula usada em produção.
 */

import type { DeviceMotionMeasurement, DeviceMotionOrientation } from 'expo-sensors';
import type { Angles, MotionSample, Vector3 } from '../core/types';

/** Aceleração gravitacional padrão da Terra, em m/s². */
export const G = 9.80665;

/**
 * Tolerância numérica padrão, em graus.
 *
 * 1e-9 é ~5 ordens de grandeza acima do erro de ponto flutuante que o JS
 * introduz numa sequência de atan2/tan (medido em ~1.4e-14), e ~6 ordens abaixo
 * da menor diferença que faria sentido físico num inclinômetro. É o degrau entre
 * "arrumei a matemática" e "refatorei a matemática" — por isso o AngleConverter,
 * que é função pura e determinística, usa `toBeCloseTo` em tudo.
 */
export const TOL = 1e-9;

const RAD = Math.PI / 180;

// ---------------------------------------------------------------------------
// Vetores
// ---------------------------------------------------------------------------

export function vec(x = 0, y = 0, z = 0): Vector3 {
  return { x, y, z };
}

export function magnitude(v: Vector3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

/** Devolve o mesmo vetor com outro comprimento, mantendo a direção. */
export function withMagnitude(v: Vector3, m: number): Vector3 {
  const len = magnitude(v);
  if (len === 0) return vec(0, 0, 0);
  const k = m / len;
  return vec(v.x * k, v.y * k, v.z * k);
}

// ---------------------------------------------------------------------------
// Amostra de movimento (contrato entre SensorService e FilterService)
// ---------------------------------------------------------------------------

/**
 * MotionSample no estado "deitado, tela para cima": gravidade em -Z, sem
 * rotação, sem taxa de rotação — a pose de repouso da convenção W3C.
 * Sobrescreva só o campo que o teste está exercitando.
 */
export function motionSample(overrides: Partial<MotionSample> = {}): MotionSample {
  return {
    accelerationIncludingGravity: overrides.accelerationIncludingGravity ?? vec(0, 0, -G),
    rotationRate: overrides.rotationRate ?? vec(0, 0, 0),
    rotation: overrides.rotation ?? vec(0, 0, 0),
    timestamp: overrides.timestamp ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Evento cru do expo-sensors (entrada do SensorService)
// ---------------------------------------------------------------------------

/** Evento DeviceMotion em repouso, espelhando a pose padrão de motionSample. */
export function rawMotion(overrides: Partial<DeviceMotionMeasurement> = {}): DeviceMotionMeasurement {
  return {
    acceleration: null,
    accelerationIncludingGravity: { x: 0, y: 0, z: -G, timestamp: 1000 },
    rotation: { alpha: 0, beta: 0, gamma: 0, timestamp: 1000 },
    rotationRate: { alpha: 0, beta: 0, gamma: 0, timestamp: 1000 },
    interval: 1000 / 60,
    // Literal, não o enum em tempo de execução: os testes do SensorService
    // substituem o módulo expo-sensors inteiro por um mock, e `orientation`
    // não faz parte do contrato — é só para o evento ter a forma do expo.
    orientation: 0 as DeviceMotionOrientation,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Gerador de pose — a base do round-trip físico do AngleConverter
// ---------------------------------------------------------------------------

/**
 * Constrói o vetor gravidade (unidade, m/s²) de uma pose (roll, trim) conhecida.
 *
 *   g ∝ (tan roll, −tan trim, −1)
 *
 * Deriva-se da geometria, não da fórmula do conversor: o celular deitado é
 * (0, 0, −1); adernar para a direita gira o vetor em torno do eixo Y e trim em
 * torno do X. Aplicando `atan2` a esse vetor — como o AngleConverter faz —
 * volta-se exatamente à pose de origem.
 *
 * VALE NO SEMIESPAÇO "TELA PARA CIMA" (g.z < 0), que é onde roll e trim ficam
 * ambos em (−90, 90). É a região fisicamente relevante do app (roll ±30°,
 * trim ±20°, celular apoiado no convés) e onde o round-trip é exato.
 *
 * Fora dela o celular está virado para baixo (g.z > 0): o roll continua bem
 * definido em (90, 180], mas o trim degenere e satura em ±90. As poses desse
 * semiespaço são os polos da doc (de bruços, de lado) e ficam nos golden
 * vectors, com literais — não dá para construí-las com tangente, que tem salto
 * de ramo em ±90°.
 */
export function poseToGravity(rollDeg: number, trimDeg: number, m = G): Vector3 {
  const v = vec(Math.tan(rollDeg * RAD), -Math.tan(trimDeg * RAD), -1);
  return withMagnitude(v, m);
}

// ---------------------------------------------------------------------------
// Estatística (para as invariantes de filtragem)
// ---------------------------------------------------------------------------

export function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, v) => acc + v, 0) / values.length;
}

/** Desvio-padrão populacional em torno da média da própria série. */
export function stdDev(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const m = mean(values);
  const variance = values.reduce((acc, v) => acc + (v - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/** PRNG determinístico (mulberry32): o fuzz reprodutível em qualquer máquina. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Asserções
// ---------------------------------------------------------------------------

export function expectVecClose(received: Vector3, expected: Vector3, tol = TOL): void {
  expect(received.x).toBeCloseTo(expected.x, Math.round(-Math.log10(tol)));
  expect(received.y).toBeCloseTo(expected.y, Math.round(-Math.log10(tol)));
  expect(received.z).toBeCloseTo(expected.z, Math.round(-Math.log10(tol)));
}

export function expectAnglesClose(
  received: Angles,
  expectedRoll: number,
  expectedTrim: number,
  tol = TOL,
): void {
  expect(received.roll).toBeCloseTo(expectedRoll, Math.round(-Math.log10(tol)));
  expect(received.trim).toBeCloseTo(expectedTrim, Math.round(-Math.log10(tol)));
}
