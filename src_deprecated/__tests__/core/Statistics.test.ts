/**
 * `Statistics` — média e desvio padrão incrementais.
 *
 * O valor travado aqui é o **significado físico** das medidas do relatório: a
 * média de um conjunto de ângulos é a média deles, o desvio é o populacional
 * (divisor N), e a "abertura em graus" é `max − min`. Um relatório com média
 * errada é um relatório que formaliza a prova errado — é o tipo de bug que só
 * apareceria na audiência.
 *
 * Como a fórmula de Welford só está correta se as premissas dela valerem (uma
 * amostra por vez, sem reordenar, `m2` nunca negativo), os testes comparam
 * sempre contra a fórmula fechada calculada numa segunda passagem — não contra
 * um número mágico.
 */

import { createAngleStatistics, createStatistics } from '../../core/recording/Statistics';

/** Média e desvio populacional calculados numa segunda varredura, para conferir. */
function closedForm(values: readonly number[]) {
  const n = values.length;
  const mean = values.reduce((sum, v) => sum + v, 0) / n;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;
  return { mean, std: Math.sqrt(variance), min: Math.min(...values), max: Math.max(...values) };
}

/** Mesma referência, mas entrando uma a uma — como a gravação recebe. */
function feed(values: readonly number[]) {
  const stats = createStatistics();
  for (const value of values) {
    stats.add(value);
  }
  return stats.snapshot();
}

const TOLERANCE = 1e-9;

describe('Statistics · contrato de forma', () => {
  it('nasce zerado, sem amostras', () => {
    expect(createStatistics().snapshot()).toEqual({ mean: 0, std: 0, min: 0, max: 0 });
  });

  it('conta as amostras que entraram', () => {
    const stats = createStatistics();
    stats.add(1);
    stats.add(2);
    stats.add(3);

    expect(stats.count).toBe(3);
  });

  it('devolve um objeto novo a cada snapshot', () => {
    const stats = createStatistics();
    stats.add(4);

    const first = stats.snapshot();
    const second = stats.snapshot();

    expect(first).not.toBe(second);
    expect(first).toEqual(second);
  });
});

describe('Statistics · semântica das medidas', () => {
  it('a primeira amostra é a média, o mínimo e o máximo, com desvio zero', () => {
    expect(createStatistics().snapshot()).toEqual({ mean: 0, std: 0, min: 0, max: 0 });

    const stats = createStatistics();
    stats.add(7.5);

    expect(stats.snapshot()).toEqual({ mean: 7.5, std: 0, min: 7.5, max: 7.5 });
  });

  it('bate com a média aritmética de uma série assimétrica', () => {
    // Média 2 ≠ mediana 1: se a implementação trocar uma pela outra, muda.
    const values = [0, 0, 0, 0, 0, 0, 0, 0, 12];

    expect(feed(values).mean).toBe(closedForm(values).mean);
  });

  it('o desvio usa divisor N, não N−1', () => {
    const values = [2, 4, 4, 4, 5, 5, 7, 9];

    const snapshot = feed(values);

    // Amostral (N−1) seria ~2,13809; populacional (N) ~2.
    expect(snapshot.std).toBeCloseTo(2, 12);
  });

  it('mantém precisão onde a soma de quadrados perderia', () => {
    // Ângulos pequenos em torno de um offset: o relatório da Prova de Inclinação
    // vive nessa faixa. A fórmula E[x²] − E[x]² devolve 0 ou lixo aqui.
    const values = Array.from({ length: 5000 }, (_, i) => 20 + (i % 2 === 0 ? 0.001 : -0.001));

    const snapshot = feed(values);

    expect(snapshot.mean).toBeCloseTo(20, 10);
    expect(snapshot.std).toBeCloseTo(0.001, 10);
  });

  it('min e max acompanham os extremos, inclusive em série não monotônica', () => {
    const values = [3, -12, 8, 41, -0.5, 7];
    const snapshot = feed(values);

    expect(snapshot.min).toBe(-12);
    expect(snapshot.max).toBe(41);
  });

  it('a abertura em graus é max − min', () => {
    const values = [3.2, -1.1, 8.4, 0.7];
    const snapshot = feed(values);

    expect(snapshot.max - snapshot.min).toBe(closedForm(values).max - closedForm(values).min);
  });

  it('bate com a fórmula fechada em séries longas', () => {
    const values = Array.from({ length: 2000 }, (_, i) => Math.sin(i / 37) * 45 + 12);

    const snapshot = feed(values);
    const reference = closedForm(values);

    expect(snapshot.mean).toBeCloseTo(reference.mean, 9);
    expect(snapshot.std).toBeCloseTo(reference.std, 9);
  });

  it('não acumula erro de precisão ao longo de muitas amostras', () => {
    // A média exata é 10. Se cada passo dividisse por uma média truncada, a
    // deriva ficaria visível depois de milhares de increments.
    const stats = createStatistics();
    for (let i = 0; i < 100000; i += 1) {
      stats.add(10);
    }

    expect(stats.snapshot().mean).toBe(10);
  });

  it('trabalha com ângulos negativos', () => {
    const values = [-30.5, -12, -44.25, -1];

    const snapshot = feed(values);
    const reference = closedForm(values);

    expect(snapshot.mean).toBeCloseTo(reference.mean, 12);
    expect(snapshot.std).toBeCloseTo(reference.std, 12);
    expect(snapshot.min).toBe(-44.25);
    expect(snapshot.max).toBe(-1);
  });
});

describe('Statistics · entradas degeneradas', () => {
  it('ignora valores não finitos sem quebrar a contagem', () => {
    const stats = createStatistics();
    stats.add(4);
    stats.add(Number.NaN);
    stats.add(Number.POSITIVE_INFINITY);
    stats.add(Number.NEGATIVE_INFINITY);
    stats.add(6);

    expect(stats.count).toBe(2);
    expect(stats.snapshot()).toEqual(feed([4, 6]));
  });

  it('uma série só de valores não finitos continua zerada', () => {
    const stats = createStatistics();
    stats.add(Number.NaN);

    expect(stats.count).toBe(0);
    expect(stats.snapshot()).toEqual({ mean: 0, std: 0, min: 0, max: 0 });
  });

  it('um desvio que roaria negativo não vira NaN', () => {
    // `m2` é acumulado por produtos; arredondamento poderia deixá-lo em -0.
    // A raiz de um negativo seria NaN e poluiria o relatório inteiro.
    const stats = createStatistics();
    for (let i = 0; i < 5000; i += 1) {
      stats.add(1 / 3);
    }

    expect(Number.isNaN(stats.snapshot().std)).toBe(false);
    expect(stats.snapshot().std).toBeGreaterThanOrEqual(0);
  });
});

describe('Statistics · reset', () => {
  it('volta ao estado inicial', () => {
    const stats = createStatistics();
    stats.add(10);
    stats.add(20);

    stats.reset();

    expect(stats.count).toBe(0);
    expect(stats.snapshot()).toEqual({ mean: 0, std: 0, min: 0, max: 0 });

    stats.add(5);
    expect(stats.snapshot()).toEqual({ mean: 5, std: 0, min: 5, max: 5 });
  });
});

describe('AngleStatisticsPair', () => {
  it('mantém roll e trim independentes', () => {
    const pair = createAngleStatistics();

    pair.roll.add(10);
    pair.roll.add(20);
    pair.trim.add(-4);
    pair.trim.add(4);
    pair.trim.add(0);

    expect(pair.count).toBe(2);
    expect(pair.roll.snapshot().mean).toBe(15);
    expect(pair.trim.snapshot().mean).toBe(0);
    expect(pair.trim.count).toBe(3);
  });

  it('zera os dois eixos de uma vez', () => {
    const pair = createAngleStatistics();
    pair.roll.add(1);
    pair.trim.add(2);

    pair.reset();

    expect(pair.count).toBe(0);
    expect(pair.roll.count).toBe(0);
    expect(pair.trim.count).toBe(0);
    expect(pair.roll.snapshot().mean).toBe(0);
    expect(pair.trim.snapshot().mean).toBe(0);
  });
});