/**
 * Contrato do FilterService — a etapa que tira ruído da amostra do sensor.
 *
 * A documentação é explícita: o algoritmo pode ser trocado sem alterar o resto
 * do pipeline, e só os testes desta etapa mudam junto. Por isso NÃO há golden
 * value aqui — não existe número "certo" para um filtro. O que existe são as
 * propriedades que qualquer filtro decente precisa ter, e que são o que a UI
 * sente na tela:
 *
 *   - a mesma forma de MotionSample atravessando a fronteira (é o contrato)
 *   - nenhuma transição feia no instante em que a medição começa
 *   - nenhuma deriva quando a embarcação está parada
 *   - ruído de fato reduzido (é o propósito da etapa, US-03)
 *
 * Trocar EMA por mediana-5, Butterworth ou Kalman e continuar verde. Um filtro
 * com sinal invertido, α > 1 ou que devolve lixo não passa.
 */

import { createFilter } from '../../core/processing/FilterService';
import type { MotionSample, Vector3 } from '../../core/types';
import {
  G,
  expectVecClose,
  motionSample,
  seededRandom,
  stdDev,
  vec,
} from '../../test-utils/motion';

/**
 * Tolerância de deriva, em m/s². Mais folgada que a TOL global (1e-9) de
 * propósito: aqui a pergunta não é "é bit-exact?", é "o valor estacionário é o
 * valor de entrada?". Um filtro lento pode levar algumas centenas de amostras
 * para convergir dentro de 1e-9, e isso é comportamento legítimo — o que não é
 * legítimo é ele nunca chegar lá. 1e-6 m/s² é 1e-7 da gravidade: irrelevante
 * fisicamente, mas inalcançável para um filtro que está integram.
 */
const DRIFT_TOL = 1e-6;

/** Alimenta o filtro e devolve todas as saídas. */
function feed(filter: { process: (s: MotionSample) => MotionSample }, inputs: MotionSample[]) {
  return inputs.map((input) => filter.process(input));
}

const steadyPose = (x = 2.5, y = -1.0, z = -9.2) => vec(x, y, z);

// ---------------------------------------------------------------------------
// Contrato de forma — o que atravessa a fronteira para o AngleConverter
// ---------------------------------------------------------------------------

describe('createFilter · contrato de forma', () => {
  it('devolve uma MotionSample com exatamente as mesmas 4 chaves da entrada', () => {
    const filter = createFilter();
    const input = motionSample({ accelerationIncludingGravity: vec(1, -2, -9) });

    const output = filter.process(input);

    expect(Object.keys(output).sort()).toEqual(Object.keys(input).sort());
    expect(Object.keys(output).sort()).toEqual([
      'accelerationIncludingGravity',
      'rotation',
      'rotationRate',
      'timestamp',
    ]);
  });

  it('devolve os três vetores com exatamente as chaves x, y, z', () => {
    const filter = createFilter();

    const output = filter.process(motionSample({ accelerationIncludingGravity: vec(1, -2, -9) }));

    for (const key of ['accelerationIncludingGravity', 'rotationRate', 'rotation'] as const) {
      expect(Object.keys(output[key]).sort()).toEqual(['x', 'y', 'z']);
    }
  });

  it('mantém timestamp numérico, sem reordenar nem reescrever a série', () => {
    const filter = createFilter();
    // Timestamps fora de ordem e repetidos: o filtro não pode "consertar" a
    // ordem do relógio do sensor, só remover ruído do valor.
    const inputs = [1000, 1000, 983, 1000, 2500, 2500, 17].map((timestamp, i) =>
      motionSample({ accelerationIncludingGravity: steadyPose(i, 0, -9), timestamp }),
    );

    const outputs = feed(filter, inputs);

    expect(outputs.map((o) => o.timestamp)).toEqual([1000, 1000, 983, 1000, 2500, 2500, 17]);
  });

  it('não altera o objeto recebido (MotionSample é readonly)', () => {
    const filter = createFilter();
    const input = motionSample({ accelerationIncludingGravity: vec(3, 1, -9), timestamp: 77 });
    const before = JSON.parse(JSON.stringify(input));

    filter.process(input);
    filter.process(input);

    expect(input).toEqual(before);
  });

  it('é determinístico: a mesma série produz exatamente a mesma saída', () => {
    const series = Array.from({ length: 50 }, (_, i) =>
      motionSample({ accelerationIncludingGravity: vec(i * 0.3, -i * 0.1, -9 + i * 0.05), timestamp: i }),
    );

    expect(feed(createFilter(), series)).toEqual(feed(createFilter(), series));
  });
});

// ---------------------------------------------------------------------------
// Invariante 1 · partida sem transiente
//
// DECISÃO DE PROJETO, não física. O inclinômetro é ao vivo: se o filtro
// suavizar a primeira leitura, a tela mostra um número intermediário no exato
// instante em que a medição começa — telefone na mão, no convés.
//
// Esta invariante NÃO é universal: um filtro de janela (mediana-3, por exemplo)
// precisa de N amostras antes de produzir a primeira saída. Se a equipe trocar
// por um desses, apague este bloco e registre o atraso de partida como dívida
// de UX. Nada mais no arquivo precisa mudar.
// ---------------------------------------------------------------------------

describe('createFilter · partida', () => {
  it('a primeira amostra passa direto, sem suavizar', () => {
    const filter = createFilter();
    const first = vec(3.35, -2.0, -9.0);

    const output = filter.process(motionSample({ accelerationIncludingGravity: first }));

    expectVecClose(output.accelerationIncludingGravity, first);
  });

  it('a primeira amostra em qualquer pose também passa direto', () => {
    for (const gravity of [
      vec(0, 0, -G),
      vec(G, 0, 0),
      vec(-G, 0, 0),
      vec(0, 0, G),
      vec(0, -G, 0),
      vec(4.9, -1.7, -8.4),
    ]) {
      const filter = createFilter();

      expectVecClose(filter.process(motionSample({ accelerationIncludingGravity: gravity })).accelerationIncludingGravity, gravity);
    }
  });
});

// ---------------------------------------------------------------------------
// Estabilidade — o que a UI sente com o barco parado e com ruído do sensor
// ---------------------------------------------------------------------------

describe('createFilter · estabilidade', () => {
  it('entrada constante produz saída constante, sem deriva acumulada', () => {
    const filter = createFilter();
    const steady = steadyPose();

    for (let i = 0; i < 500; i += 1) {
      const output = filter.process(motionSample({ accelerationIncludingGravity: steady, timestamp: i }));

      // Um integrador sem amortecimento, ou um filtro com sinal invertido, sai
      // daqui imediatamente.
      expect(Math.abs(output.accelerationIncludingGravity.x - steady.x)).toBeLessThan(DRIFT_TOL);
      expect(Math.abs(output.accelerationIncludingGravity.y - steady.y)).toBeLessThan(DRIFT_TOL);
      expect(Math.abs(output.accelerationIncludingGravity.z - steady.z)).toBeLessThan(DRIFT_TOL);
    }
  });

  it('entrada constante em repouso não deriva', () => {
    const filter = createFilter();
    const flat = vec(0, 0, -G);

    for (let i = 0; i < 500; i += 1) {
      expectVecClose(
        filter.process(motionSample({ accelerationIncludingGravity: flat, timestamp: i })).accelerationIncludingGravity,
        flat,
        DRIFT_TOL,
      );
    }
  });

  it('reduz o ruído do sensor (desvio-padrão da saída menor que o da entrada)', () => {
    const filter = createFilter();
    const random = seededRandom(4242);
    const base = vec(3.2, -1.1, -9.1);
    const noiseAmplitude = 0.4;

    const inputs = Array.from({ length: 400 }, (_, i) =>
      motionSample({
        accelerationIncludingGravity: vec(
          base.x + (random() - 0.5) * 2 * noiseAmplitude,
          base.y + (random() - 0.5) * 2 * noiseAmplitude,
          base.z + (random() - 0.5) * 2 * noiseAmplitude,
        ),
        timestamp: i * (1000 / 60),
      }),
    );

    const outputs = feed(filter, inputs);
    const inputDeviation = stdDev(inputs.map((s) => s.accelerationIncludingGravity.x));
    const outputDeviation = stdDev(outputs.map((s) => s.accelerationIncludingGravity.x));

    // Estritamente menor: um α = 1 (passa tudo direto) daria igualdade e falha
    // aqui — que é o resultado correto para o propósito da etapa.
    expect(inputDeviation).toBeGreaterThan(0);
    expect(outputDeviation).toBeLessThan(inputDeviation);
  });

  it('reduz o ruído também quando ele é uma oscilação alternada', () => {
    const filter = createFilter();
    const base = vec(-2.5, 0.8, -9.3);
    const amplitude = 0.6;

    const inputs = Array.from({ length: 300 }, (_, i) =>
      motionSample({
        accelerationIncludingGravity: vec(
          base.x + (i % 2 === 0 ? amplitude : -amplitude),
          base.y,
          base.z,
        ),
        timestamp: i * (1000 / 60),
      }),
    );

    const outputs = feed(filter, inputs);

    expect(stdDev(outputs.map((s) => s.accelerationIncludingGravity.x)))
      .toBeLessThan(stdDev(inputs.map((s) => s.accelerationIncludingGravity.x)));
  });

  it('nunca produz NaN nem Infinity, mesmo com picos absurdos e saltos de tempo', () => {
    const filter = createFilter();
    const nasty: Vector3[] = [
      vec(1e9, -1e9, 1e9),
      vec(0, 0, 0),
      vec(-1e-30, 1e-30, 1e-30),
      vec(3, 3, 3),
      vec(-1e6, 1e6, -1e6),
      vec(0.0001, 0, -G),
      vec(Number.MAX_SAFE_INTEGER, 0, -Number.MAX_SAFE_INTEGER),
    ];

    for (let i = 0; i < nasty.length * 3; i += 1) {
      const gravity = nasty[i % nasty.length];
      const output = filter.process(
        motionSample({
          accelerationIncludingGravity: gravity,
          // Timestamps com saltos absurdos: um filtro que derive dt pode explodir.
          timestamp: [0, 16, 1_000_000, 16, 0, 250_000, 33, 16, 999_999][i],
        }),
      );

      for (const key of ['accelerationIncludingGravity', 'rotationRate', 'rotation'] as const) {
        expect(Number.isFinite(output[key].x)).toBe(true);
        expect(Number.isFinite(output[key].y)).toBe(true);
        expect(Number.isFinite(output[key].z)).toBe(true);
      }
      expect(Number.isFinite(output.timestamp)).toBe(true);
    }
  });

  it('acompanha a pose nova depois de um salto grande (virada de borda)', () => {
    const filter = createFilter();
    const before = steadyPose(1, 0, -9.4);
    const after = steadyPose(-7, 2, -7.5);

    for (let i = 0; i < 200; i += 1) {
      filter.process(motionSample({ accelerationIncludingGravity: before, timestamp: i }));
    }

    // Virada de borda: o celular passa de adernado a estibordo.
    const afterStep: MotionSample[] = [];
    for (let i = 200; i < 900; i += 1) {
      afterStep.push(filter.process(motionSample({ accelerationIncludingGravity: after, timestamp: i })));
    }

    // Não se exige que a PRIMEIRA saída pós-salto já acompanhe — um filtro
    // precisa de algumas amostras para assentar. O que se exige é que ele
    // chegue lá: um filtro que ignora o salto (ou que satura) nunca assenta.
    const settled = afterStep[afterStep.length - 1];
    expect(Math.abs(settled.accelerationIncludingGravity.x - after.x)).toBeLessThan(DRIFT_TOL);
    expect(Math.abs(settled.accelerationIncludingGravity.y - after.y)).toBeLessThan(DRIFT_TOL);
    expect(Math.abs(settled.accelerationIncludingGravity.z - after.z)).toBeLessThan(DRIFT_TOL);
  });
});
