import { useCallback, useEffect, useRef, useState } from 'react';
import { toAngles, toSignedAngles } from '../processing/AngleConverter';
import { createFilter, type Filter } from '../processing/FilterService';
import { createSensorService, type SensorService } from '../sensors/SensorService';
import type { Calibration, MotionSample } from '../types';

const ZERO_CALIBRATION: Calibration = { roll: 0, trim: 0 };

export interface UseInclinationOptions {
  sensorService?: SensorService;
  filter?: Filter;
  updateIntervalMs?: number;
}

export interface UseInclinationResult {
  roll: number;
  trim: number;
  isRunning: boolean;
  isCalibrated: boolean;
  error: string | null;
  start(): Promise<void>;
  stop(): void;
  calibrate(): void;
}

export function useInclination(options: UseInclinationOptions = {}): UseInclinationResult {
  const [service] = useState<SensorService>(
    () => options.sensorService ?? createSensorService({ updateIntervalMs: options.updateIntervalMs }),
  );
  const [filter] = useState<Filter>(() => options.filter ?? createFilter());

  const calibrationRef = useRef<Calibration>(ZERO_CALIBRATION);
  const latestSampleRef = useRef<MotionSample | null>(null);

  const [roll, setRoll] = useState(0);
  const [trim, setTrim] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSample = useCallback(
    (sample: MotionSample) => {
      latestSampleRef.current = sample;
      const angles = toAngles(filter.process(sample), calibrationRef.current);
      setRoll(angles.roll);
      setTrim(angles.trim);
    },
    [filter],
  );

  const start = useCallback(async (): Promise<void> => {
    if (isRunning) {
      return;
    }
    setError(null);
    try {
      await service.start(handleSample);
      setIsRunning(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erro ao iniciar o sensor');
      setIsRunning(false);
    }
  }, [service, handleSample, isRunning]);

  const stop = useCallback((): void => {
    service.stop();
    setIsRunning(false);
  }, [service]);

  const calibrate = useCallback((): void => {
    const sample = latestSampleRef.current;
    if (!sample) {
      setError('Sem dados do sensor para calibrar');
      return;
    }
    calibrationRef.current = toSignedAngles(filter.process(sample));
    setIsCalibrated(true);
    setError(null);
  }, [filter]);

  useEffect(() => {
    return () => {
      service.stop();
    };
  }, [service]);

  return { roll, trim, isRunning, isCalibrated, error, start, stop, calibrate };
}
