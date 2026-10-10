import { useCallback, useEffect, useRef, useState } from 'react';
import { toAngles } from '../processing/AngleConverter';
import { createFilter } from '../processing/FilterService';
import type { Filter } from '../processing/FilterService';
import { createSensorService } from '../sensors/SensorService';
import type { SensorService } from '../sensors/SensorService';
import type { Angles, Calibration, MotionSample } from '../types';

export interface UseInclinationResult {
  roll: number;
  trim: number;
  isRunning: boolean;
  isCalibrated: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  calibrate: () => void;
}

export interface UseInclinationOptions {
  /**
   * Recebe cada par de ângulos assim que ele é calculado — já filtrado e já
   * calibrado, ou seja, exatamente o que está no mostrador.
   *
   * É a torneira que o gravador usa. Ela existe aqui, e não no `SensorService`,
   * por um motivo: a série gravada tem que ser a mesma que o usuário viu, e um
   * segundo sensor teria um segundo filtro e um segundo estado de calibração.
   *
   * Três regras, e as três vêm do caminho de 60 Hz:
   *
   * - **A referência precisa ser estável** (ex.: um `useCallback`), senão o
       efeito que a instala re-roda a cada amostra. Por isso a assinatura é
   *   lida de uma `ref` e não da opção direto.
   * - **O instante é `Date.now()`, não `sample.timestamp`.** O timestamp do
   *   sensor é ms desde o boot no Android e segundos desde o boot no iOS;
   *   misturá-lo com o relógio do relatório quebraria o eixo x do gráfico.
   * - **Não deve lançar.** A chamada acontece dentro do callback do
   *   `DeviceMotion`; uma exceção aqui subiria para o emissor de eventos do
   *   sensor, não para quem chamou.
   */
  onSample?: (angles: Angles, tMs: number) => void;
}

const NEUTRAL: Angles = { roll: 0, trim: 0 };

/**
 * ViewModel entre o pipeline do core e a interface.
 *
 * Orquestra SensorService -> FilterService -> AngleConverter, guarda o estado
 * e expoe as acoes. A interface so conversa com este hook.
 *
 * Duas restricoes vem da interface, nao do pipeline:
 *
 * - As tres acoes sao `useCallback` com deps vazias. `HomeScreen` faz
 *   `useEffect(() => { void start() }, [start])`, entao uma referencia nova a
 *   cada render re-dispararia o efeito para sempre.
 * - `start` nunca rejeita. A tela chama `void start()`, e uma rejeicao nao
 *   observada viraria unhandled rejection; o erro vai para `error`.
 */
export function useInclination(options: UseInclinationOptions = {}): UseInclinationResult {
  const [angles, setAngles] = useState<Angles>(NEUTRAL);
  const [isRunning, setIsRunning] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensorRef = useRef<SensorService | null>(null);
  const filterRef = useRef<Filter | null>(null);
  const calibrationRef = useRef<Calibration | null>(null);
  const latestRef = useRef<Angles>(NEUTRAL);
  const runningRef = useRef(false);

  // A opção entra por uma ref para que o `handleSample` continue com deps
  // vazias: se ele dependesse de `options.onSample`, uma referência nova a cada
  // render criaria um `handleSample` novo, que re-assinaria o sensor.
  const onSampleRef = useRef<((angles: Angles, tMs: number) => void) | null>(null);

  useEffect(() => {
    onSampleRef.current = options.onSample ?? null;
  }, [options.onSample]);

  const handleSample = useCallback((sample: MotionSample): void => {
    const filter = filterRef.current;
    if (filter === null || !runningRef.current) {
      return;
    }

    const next = toAngles(filter.process(sample), calibrationRef.current ?? undefined);
    latestRef.current = next;
    setAngles(next);

    const onSample = onSampleRef.current;
    if (onSample !== null) {
      onSample(next, Date.now());
    }
  }, []);

  const start = useCallback(async (): Promise<void> => {
    try {
      const filter = filterRef.current ?? createFilter();
      filterRef.current = filter;

      const sensor = sensorRef.current ?? createSensorService();
      sensorRef.current = sensor;

      runningRef.current = true;
      await sensor.start(handleSample);

      setError(null);
      setIsRunning(true);
    } catch (cause) {
      runningRef.current = false;
      setIsRunning(false);
      setError(cause instanceof Error ? cause.message : 'Falha ao iniciar o sensor');
    }
  }, [handleSample]);

  const stop = useCallback((): void => {
    runningRef.current = false;
    if (sensorRef.current !== null) {
      sensorRef.current.stop();
    }
    setIsRunning(false);
  }, []);

  const calibrate = useCallback((): void => {
    const reading = latestRef.current;
    calibrationRef.current = { roll: reading.roll, trim: reading.trim };
    setIsCalibrated(true);
  }, []);

  useEffect(() => {
    return () => {
      runningRef.current = false;
      if (sensorRef.current !== null) {
        sensorRef.current.stop();
      }
    };
  }, []);

  return {
    roll: angles.roll,
    trim: angles.trim,
    isRunning,
    isCalibrated,
    error,
    start,
    stop,
    calibrate,
  };
}