/**
 * Média e desvio padrão incrementais de uma série de ângulos.
 *
 * O relatório precisa de média, desvio, mínimo e máximo dos dois eixos
 * (`PROTOTIPO.md` §Relatório — Detalhe, "Medidas" e "Abertura em graus"), e
 * precisa deles **já no cabeçalho**, porque é o cabeçalho que sobrevive a um
 * app fechado no meio da prova. Guardar a série inteira em memória para
 * recalcular seria o oposto: a perda do celular viraria perda das medidas.
 *
 * Por isso os agregados são atualizados amostra a amostra, com o algoritmo de
 * Welford: um único passo, sem segunda varredura, e estável em ponto flutuante
 * (a fórmula ingênua `E[x²] − E[x]²` perde precisão justamente nos ângulos
 * pequenos, que é a faixa em que a Prova de Inclinação trabalha).
 *
 * Uma instância acompanha um eixo. O `createAngleStatistics()` devolve o par
 * pronto porque roll e trim evoluem juntos e ninguém quer repetir o par de
 * linhas a cada amostra.
 */

import type { AngleStatistics } from '../types';

const EMPTY: AngleStatistics = { mean: 0, std: 0, min: 0, max: 0 };

export interface Statistics {
  /** Incorpora uma leitura. Ignora valores não finitos. */
  add(value: number): void;
  /** O estado atual. Objeto novo a cada chamada — não guarda referência interna. */
  snapshot(): AngleStatistics;
  /** Quantas amostras entraram. */
  readonly count: number;
  /** Esquece tudo, como se a instância fosse nova. */
  reset(): void;
}

/**
 * Estado interno de um eixo.
 *
 * `m2` é a soma dos desvios quadrado médios: a soma acumulada que Welford
 * mantém em vez de guardar as amostras. `Math.sqrt(m2 / count)` é o desvio
 * padrão populacional — divisor N, não N−1, que é a convenção que o protótipo
 * usa e a que o relatório mostra.
 */
interface AxisState {
  count: number;
  mean: number;
  m2: number;
  min: number;
  max: number;
}

function createAxis(): AxisState {
  return { count: 0, mean: 0, m2: 0, min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY };
}

function snapshotAxis(axis: AxisState): AngleStatistics {
  if (axis.count === 0) {
    return EMPTY;
  }

  return {
    mean: axis.mean,
    std: Math.sqrt(axis.m2 / axis.count),
    min: axis.min,
    max: axis.max,
  };
}

/** Cria o acumulador de um único eixo. */
export function createStatistics(): Statistics {
  const axis = createAxis();

  return {
    add(value: number): void {
      if (!Number.isFinite(value)) {
        return;
      }

      axis.count += 1;

      // Welford: a média nova absorve a amostra, e o desvio accumulated
      // corrige a diferença entre a média antiga e a nova.
      const delta = value - axis.mean;
      axis.mean += delta / axis.count;
      const delta2 = value - axis.mean;
      axis.m2 += delta * delta2;

      if (value < axis.min) {
        axis.min = value;
      }
      if (value > axis.max) {
        axis.max = value;
      }
    },

    snapshot(): AngleStatistics {
      return snapshotAxis(axis);
    },

    get count(): number {
      return axis.count;
    },

    reset(): void {
      const fresh = createAxis();
      axis.count = fresh.count;
      axis.mean = fresh.mean;
      axis.m2 = fresh.m2;
      axis.min = fresh.min;
      axis.max = fresh.max;
    },
  };
}

/**
 * O par roll + trim, porque a gravação sempre recebe os dois juntos e o relatório
 * sempre mostra os dois juntos. Duas instâncias independentes: o eixo não sabe
 * nada do outro.
 */
export interface AngleStatisticsPair {
  readonly roll: Statistics;
  readonly trim: Statistics;
  /** Total de amostras do eixo de roll — o que vai para `sample_count`. */
  readonly count: number;
  reset(): void;
}

export function createAngleStatistics(): AngleStatisticsPair {
  const roll = createStatistics();
  const trim = createStatistics();

  return {
    roll,
    trim,
    get count(): number {
      return roll.count;
    },
    reset(): void {
      roll.reset();
      trim.reset();
    },
  };
}