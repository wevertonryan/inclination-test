import type { MotionSample, Vector3 } from '../types';

const DEFAULT_ALPHA = 0.15;

export interface FilterOptions {
  alpha?: number;
}

export interface Filter {
  process(sample: MotionSample): MotionSample;
}

function copy(vector: Vector3): Vector3 {
  return { x: vector.x, y: vector.y, z: vector.z };
}

/**
 * Media movel exponencial sobre os tres vetores da amostra.
 *
 * `alpha` e a fatia da leitura nova que entra a cada amostra: 0.15 entrega 15%
 * do valor atual e mantem 85% do anterior. A 60 Hz isso da um tempo de
 * acomodacao de ~110 ms.
 *
 * Duas decisoes que os testes cobram:
 *
 * - A primeira amostra passa direto. O inclinometro e ao vivo, e uma leitura
 *   suavizada no instante em que a medicao comeca mostra um numero
 *   intermediario na tela exatamente quando o usuario esta olhando.
 * - O alpha nao e derivado de dt. Um intervalo que o sensor salta (acelerometro
 *   engasgado, app em background) viraria ganho e explodiria a saida.
 */
export function createFilter(options: FilterOptions = {}): Filter {
  const alpha = Math.min(1, Math.max(Number.MIN_VALUE, options.alpha ?? DEFAULT_ALPHA));
  const keep = 1 - alpha;

  let gravity: Vector3 = { x: 0, y: 0, z: 0 };
  let rotationRate: Vector3 = { x: 0, y: 0, z: 0 };
  let rotation: Vector3 = { x: 0, y: 0, z: 0 };
  let primed = false;

  const blend = (input: Vector3, state: Vector3): Vector3 => ({
    x: alpha * input.x + keep * state.x,
    y: alpha * input.y + keep * state.y,
    z: alpha * input.z + keep * state.z,
  });

  return {
    process(sample: MotionSample): MotionSample {
      gravity = primed ? blend(sample.accelerationIncludingGravity, gravity) : copy(sample.accelerationIncludingGravity);
      rotationRate = primed ? blend(sample.rotationRate, rotationRate) : copy(sample.rotationRate);
      rotation = primed ? blend(sample.rotation, rotation) : copy(sample.rotation);
      primed = true;

      return {
        accelerationIncludingGravity: copy(gravity),
        rotationRate: copy(rotationRate),
        rotation: copy(rotation),
        timestamp: sample.timestamp,
      };
    },
  };
}