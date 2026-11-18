/**
 * Contrato do AngleConverter — a etapa que traduz aAcceleration do celular em
 * graus de Roll (adernada) e Trim (inclinação longitudinal).
 *
 * Este é o único módulo do pipeline cuja saída é uma FUNÇÃO PURA E DETERMINÍSTICA
 * de uma entrada numérica. Não existe motivo legítimo para o resultado mudar:
 * qualquer otimização tem que ser bit-exact ou cair dentro de TOL (1e-9 graus).
 * Por isso os testes aqui são rígidos e em 4 camadas — é o que impede uma
 * "melhoria" no código de virar um erro silencioso de meio grau na Prova de
 * Inclinação, que ninguém perceberia até um engenheiro naval reclamar.
 *
 * O que NÃO é travado aqui: o algoritmo. Reescrever com matriz de rotação,
 * quaternion ou Euler continua passando, desde que os graus saiam iguais.
 */

import { toAngles } from '../../core/processing/AngleConverter';
import type { Calibration, Vector3 } from '../../core/types';
import {
  G,
  TOL,
  expectAnglesClose,
  motionSample,
  poseToGravity,
  seededRandom,
  vec,
} from '../../test-utils/motion';

// ---------------------------------------------------------------------------
// Helpers locais
// ---------------------------------------------------------------------------

const sampleAt = (accelerationIncludingGravity: Vector3) =>
  motionSample({ accelerationIncludingGravity });

/** Envolve em (−180, 180]. Réplica da regra de faixa do contrato, para conferência. */
const wrap180 = (deg: number): number => {
  const w = (((deg + 180) % 360) + 360) % 360 - 180;
  return w <= -180 ? w + 360 : w;
};

/** Poses usadas como substrate no round-trip. Evita os polos (|90°|), onde o
 *  gerador de gravidade não é finito e a decomposição degenera. */
const SAFE_POSES: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [30, 0],
  [-30, 0],
  [45, 0],
  [60, 0],
  [0, 45],
  [0, -45],
  [45, 45],
  [-42.5, 17.25],
  [20, -10],
];

// ---------------------------------------------------------------------------
// Camada 1 · round-trip físico
//
// Escolhe uma pose alvo, monta o vetor gravidade daquela pose e exige que o
// conversor devolva a pose. O gerador usa tangente; o conversor resolve com
// atan2. Nenhuma linha é compartilhada, então o teste mede a FÍSICA, não a
// fórmula: sobrevive a qualquer reescrita da implementação.
// ---------------------------------------------------------------------------

describe('toAngles · round-trip físico', () => {
  it('recupera a pose numa grade de 625 combinações de roll e trim', () => {
    let worstError = 0;

    for (let roll = -84; roll <= 84; roll += 7) {
      for (let trim = -84; trim <= 84; trim += 7) {
        const out = toAngles(sampleAt(poseToGravity(roll, trim)));
        worstError = Math.max(worstError, Math.abs(out.roll - roll), Math.abs(out.trim - trim));
      }
    }

    expect(worstError).toBeLessThan(TOL);
  });

  it('recupera a pose independente da magnitude do vetor de gravidade', () => {
    for (const magnitude of [0.5, 1, G, 9.80665, 7.3 * G, 1e4]) {
      for (const [roll, trim] of SAFE_POSES) {
        expectAnglesClose(toAngles(sampleAt(poseToGravity(roll, trim, magnitude))), roll, trim);
      }
    }
  });

  it('recupera a pose em poses fora do alcance âmbar comum (±45°)', () => {
    for (const [roll, trim] of [
      [70, 0],
      [-70, 0],
      [0, 70],
      [0, -70],
      [75, -68],
      [-83.5, 84.25],
    ] as const) {
      expectAnglesClose(toAngles(sampleAt(poseToGravity(roll, trim))), roll, trim);
    }
  });
});

// ---------------------------------------------------------------------------
// Camada 2 · golden vectors
//
// Literais fixos, derivados da convenção W3C do expo-sensors. Pegam troca de
// sinal, erro de dígito e qualquer rearranjo que mude o número.
// ---------------------------------------------------------------------------

describe('toAngles · poses de referência (contrato da documentação)', () => {
  // Doc §7: "deitado (tela para cima) → 0/0; de lado → roll ±90; de bruços →
  // roll 180; proa inclinada → trim (satura em ±90)".
  // Nestas 3 poses a doc nomeia os DOIS eixos:
  it.each([
    ['deitado, tela para cima', vec(0, 0, -G), 0, 0],
    ['proa para cima', vec(0, -G, 0), 0, 90],
    ['proa para baixo', vec(0, G, 0), 0, -90],
  ])('%s', (_nome, accelerationIncludingGravity, roll, trim) => {
    expectAnglesClose(toAngles(sampleAt(accelerationIncludingGravity)), roll, trim);
  });

  // Nestas 3 a doc nomeia SÓ o roll. O trim fica de fora de propósito: com o
  // celular tombado (gravidade no plano XZ, g.z = 0) a projeção que extrai o
  // trim degenera e ele satura em ∓90. Congelar esse número aqui transformaria
  // uma limitação conhecida da decomposição em comportamento "oficial".
  // Ver a limitação registrada em DOCUMENTAÇÃO.MD.
  it.each([
    ['borda direita para baixo', vec(G, 0, 0), 90],
    ['borda esquerda para baixo', vec(-G, 0, 0), -90],
    ['de bruços, tela para baixo', vec(0, 0, G), 180],
  ])('%s', (_nome, accelerationIncludingGravity, roll) => {
    expect(toAngles(sampleAt(accelerationIncludingGravity)).roll).toBeCloseTo(roll, 9);
  });

  // Poses intermediárias com literais de precisão total. Incluem ângulos não
  // redondos para não dar espaço a um erro que só apareça em valores "normais".
  it.each([
    ['roll 30 / trim 0', vec(4.9033249999999997, 0, -8.492808026022665), 30, 0],
    ['roll -30 / trim 0', vec(-4.9033249999999997, 0, -8.492808026022665), -30, 0],
    ['roll 45 / trim 0', vec(6.934348715723055, 0, -6.9343487157230568), 45, 0],
    ['roll 60 / trim 0', vec(8.4928080260226633, 0, -4.9033250000000006), 60, 0],
    ['roll 0 / trim 45', vec(0, -6.934348715723055, -6.9343487157230568), 0, 45],
    ['roll 0 / trim -45', vec(0, 6.934348715723055, -6.9343487157230568), 0, -45],
    ['roll 45 / trim 45', vec(5.6618720173484425, -5.6618720173484425, -5.6618720173484434), 45, 45],
    ['roll -42.5 / trim 17.25', vec(-6.4582029744388088, -2.1884285757840267, -7.0478918076359269), -42.5, 17.25],
    ['roll 20 / trim -10', vec(3.3089569672638661, 1.6030387553756491, -9.09128454950452), 20, -10],
  ])('%s', (_nome, accelerationIncludingGravity, roll, trim) => {
    expectAnglesClose(toAngles(sampleAt(accelerationIncludingGravity)), roll, trim);
  });

  // Sinais — a UI depende destas duas convenções para o anel girar e a régua
  // deslizar no sentido certo. Invertê-las espelha o mostrador em silêncio.
  it('sinal de roll > 0 é borda direita para baixo', () => {
    expect(toAngles(sampleAt(poseToGravity(25, 0))).roll).toBeGreaterThan(0);
    expect(toAngles(sampleAt(poseToGravity(-25, 0))).roll).toBeLessThan(0);
  });

  it('sinal de trim > 0 é proa para cima', () => {
    expect(toAngles(sampleAt(poseToGravity(0, 25))).trim).toBeGreaterThan(0);
    expect(toAngles(sampleAt(poseToGravity(0, -25))).trim).toBeLessThan(0);
  });

  it('devolve 0/0 quando o sensor não reporta gravidade alguma', () => {
    expectAnglesClose(toAngles(sampleAt(vec(0, 0, 0))), 0, 0);
  });
});

// ---------------------------------------------------------------------------
// Camada 3 · propriedades
//
// Valem para qualquer entrada. Protegem as faixas, a puridade e a calibração
// sem depender de como a conta é feita.
// ---------------------------------------------------------------------------

describe('toAngles · propriedades', () => {
  it('mantém roll em (−180, 180] e trim em [−90, 90] em qualquer entrada', () => {
    const random = seededRandom(0xc0ffee);
    let checked = 0;

    for (let i = 0; i < 2000; i += 1) {
      // Esfera uniforme: lat/longitude aleatórias, depois normalizada.
      const polar = Math.acos(2 * random() - 1);
      const azimuth = 2 * Math.PI * random();
      const out = toAngles(sampleAt(vec(
        G * Math.sin(polar) * Math.cos(azimuth),
        G * Math.sin(polar) * Math.sin(azimuth),
        G * Math.cos(polar),
      )));

      expect(Number.isFinite(out.roll)).toBe(true);
      expect(Number.isFinite(out.trim)).toBe(true);
      expect(out.roll).toBeGreaterThan(-180.0000001);
      expect(out.roll).toBeLessThanOrEqual(180.0000001);
      expect(out.trim).toBeGreaterThanOrEqual(-90);
      expect(out.trim).toBeLessThanOrEqual(90);
      checked += 1;
    }

    expect(checked).toBe(2000);
  });

  it('não depende da magnitude do vetor de gravidade', () => {
    for (const [roll, trim] of SAFE_POSES) {
      const direction = poseToGravity(roll, trim, 1);
      const base = toAngles(sampleAt(direction));

      for (const factor of [0.001, 0.5, 1, 2, 1000]) {
        // toBeCloseTo, não toEqual: escalar o vetor introduz erro de ponto
        // flutuante (~1e-15 em graus). O que importa é que a resposta não mude
        // dentro da TOL — não que o bit seja idêntico.
        expectAnglesClose(
          toAngles(sampleAt(vec(
            direction.x * factor,
            direction.y * factor,
            direction.z * factor,
          ))),
          base.roll,
          base.trim,
        );
      }
    }
  });

  it('roll e trim são eixos independentes — variar roll não move trim', () => {
    for (let roll = -75; roll <= 75; roll += 5) {
      expect(toAngles(sampleAt(poseToGravity(roll, 0))).trim).toBeCloseTo(0, 9);
    }
  });

  it('roll e trim são eixos independentes — variar trim não move roll', () => {
    for (let trim = -75; trim <= 75; trim += 5) {
      expect(toAngles(sampleAt(poseToGravity(0, trim))).roll).toBeCloseTo(0, 9);
    }
  });

  it('ignora rotation e rotationRate (só o acelerômetro define a inclinação)', () => {
    const gravity = poseToGravity(23.5, -11.25);
    const bare = toAngles(sampleAt(gravity));

    const withRotation = toAngles(motionSample({
      accelerationIncludingGravity: gravity,
      rotation: vec(1.2, -3.4, 0.9),
      rotationRate: vec(50, -30, 12),
    }));

    expect(withRotation).toEqual(bare);
  });

  it('é pura: não altera a amostra recebida', () => {
    const sample = motionSample({
      accelerationIncludingGravity: poseToGravity(37, 19),
      timestamp: 12345,
    });
    const before = JSON.parse(JSON.stringify(sample));

    toAngles(sample);

    expect(sample).toEqual(before);
  });

  it('é determinística: a mesma entrada devolve exatamente a mesma saída', () => {
    for (const [roll, trim] of SAFE_POSES) {
      const gravity = poseToGravity(roll, trim);
      const first = toAngles(sampleAt(gravity));
      const second = toAngles(sampleAt(gravity));

      expect(second).toEqual(first);
    }
  });
});

describe('toAngles · calibração (US-01)', () => {
  const ZERO: Calibration = { roll: 0, trim: 0 };

  it('sem calibração informada equivale à calibração zerada', () => {
    for (const [roll, trim] of SAFE_POSES) {
      expect(toAngles(sampleAt(poseToGravity(roll, trim)), ZERO)).toEqual(
        toAngles(sampleAt(poseToGravity(roll, trim))),
      );
    }
  });

  it('subtrai o offset do zero, com sinal', () => {
    const gravity = poseToGravity(4.5, 0);
    const raw = toAngles(sampleAt(gravity));

    expect(toAngles(sampleAt(gravity), { roll: raw.roll, trim: 0 }).roll).toBeCloseTo(0, 9);
    expect(toAngles(sampleAt(gravity), { roll: 0, trim: raw.trim }).trim).toBeCloseTo(0, 9);
    expect(toAngles(sampleAt(gravity), { roll: 2.5, trim: -1.25 }).roll).toBeCloseTo(raw.roll - 2.5, 9);
  });

  it('zera a leitura quando a pose medida é a pose calibrada', () => {
    // O caso real de uso: barco nivelado, celular torto na mesa. O usuário
    // calibra nessa pose e a partir daí 0/0 é o novo "nivelado".
    const skewed = poseToGravity(3.5, -2.25);
    const reading = toAngles(sampleAt(skewed));

    expectAnglesClose(
      toAngles(sampleAt(skewed), { roll: reading.roll, trim: reading.trim }),
      0,
      0,
    );
  });

  it('age como translação pura, sem depender de como a conta é feita internamente', () => {
    const calibration: Calibration = { roll: 5, trim: -3 };

    for (const [roll, trim] of SAFE_POSES) {
      const raw = toAngles(sampleAt(poseToGravity(roll, trim)));
      const calibrated = toAngles(sampleAt(poseToGravity(roll, trim)), calibration);

      expect(calibrated.roll).toBeCloseTo(wrap180(raw.roll - calibration.roll), 9);
      expect(calibrated.trim).toBeCloseTo(Math.max(-90, Math.min(90, raw.trim - calibration.trim)), 9);
    }
  });

  it('re-envolve o roll calibrado em (−180, 180] em vez de estourar a faixa', () => {
    // Poses de roll perto de ±180 vivem no semiespaço "tela para baixo" (g.z > 0),
    // fora do alcance de poseToGravity — daí os literais. Sem o re-wrap, 179°
    // calibrado em −2° sairia 181° e o anel daria uma volta no mostrador.
    const nearUpsideDown = vec(0.17114964158818563, 0, 9.8051563997054245); // roll 179
    const nearUpsideDownMirror = vec(-0.17114964158818563, 0, 9.8051563997054245); // roll -179

    expect(toAngles(sampleAt(nearUpsideDown), { roll: -2, trim: 0 }).roll).toBeCloseTo(-179, 9);
    expect(toAngles(sampleAt(nearUpsideDown), { roll: -2, trim: 0 }).roll).toBeGreaterThan(-180);
    expect(toAngles(sampleAt(nearUpsideDown), { roll: 2, trim: 0 }).roll).toBeCloseTo(177, 9);
    expect(toAngles(sampleAt(nearUpsideDownMirror), { roll: 2, trim: 0 }).roll).toBeCloseTo(179, 9);
    expect(toAngles(sampleAt(nearUpsideDownMirror), { roll: -2, trim: 0 }).roll).toBeCloseTo(-177, 9);

    // E o re-wrap também vale dentro do semiespaço normal.
    expect(toAngles(sampleAt(poseToGravity(89, 0)), { roll: -92, trim: 0 }).roll).toBeCloseTo(-179, 9);
    expect(toAngles(sampleAt(poseToGravity(-89, 0)), { roll: 92, trim: 0 }).roll).toBeCloseTo(179, 9);
  });

  it('re-satura o trim calibrado em [−90, 90]', () => {
    expect(toAngles(sampleAt(poseToGravity(0, 80)), { roll: 0, trim: -20 }).trim).toBeCloseTo(90, 9);
    expect(toAngles(sampleAt(poseToGravity(0, -80)), { roll: 0, trim: 20 }).trim).toBeCloseTo(-90, 9);
  });
});

// ---------------------------------------------------------------------------
// Camada 4 · fuzz
//
// Vetores aleatórios (semente fixa, para reprodutível) contra todas as
// propriedades da Camada 3. Pega o caso raro que ninguém pensou em escrever.
// ---------------------------------------------------------------------------

describe('toAngles · fuzz', () => {
  it('satura o trim sem estourar [−90, 90] sob 5000 vetores aleatórios', () => {
    const random = seededRandom(20260210);
    let outsideTrim = 0;

    for (let i = 0; i < 5000; i += 1) {
      const out = toAngles(sampleAt(vec(
        (random() - 0.5) * 4 * G,
        (random() - 0.5) * 4 * G,
        (random() - 0.5) * 4 * G,
      )));

      if (out.trim < -90 || out.trim > 90 || !Number.isFinite(out.trim)) outsideTrim += 1;
      expect(Number.isFinite(out.roll)).toBe(true);
      expect(out.roll).toBeGreaterThanOrEqual(-180.0000001);
      expect(out.roll).toBeLessThanOrEqual(180.0000001);
    }

    expect(outsideTrim).toBe(0);
  });

  it('mantém a pose em 5000 poses aleatórias fora dos polos', () => {
    const random = seededRandom(987654321);

    for (let i = 0; i < 5000; i += 1) {
      const roll = (random() * 2 - 1) * 89.5;
      const trim = (random() * 2 - 1) * 89.5;

      expectAnglesClose(toAngles(sampleAt(poseToGravity(roll, trim))), roll, trim);
    }
  });

  it('nunca devolve NaN com magnitudes degeneradas', () => {
    for (const accelerationIncludingGravity of [
      vec(0, 0, 0),
      vec(1e-30, 0, 0),
      vec(0, 0, -1e-30),
      vec(1e12, -1e12, 1e12),
      vec(-0, -0, -0),
    ]) {
      const out = toAngles(sampleAt(accelerationIncludingGravity));

      expect(Number.isFinite(out.roll)).toBe(true);
      expect(Number.isFinite(out.trim)).toBe(true);
    }
  });
});
