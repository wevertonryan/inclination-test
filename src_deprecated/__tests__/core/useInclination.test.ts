/**
 * Contrato do useInclination — o ViewModel que costura o pipeline.
 *
 * Este é o único lugar do core que conhece as três etapas de uma vez, e é o
 * único que a interface enxerga. Ele orquestra, guarda estado e expõe as ações;
 * a UI só conversa com ele.
 *
 * As três etapas são mockadas de propósito: o teste aqui é sobre ORQUESTRAÇÃO
 * (quem recebe o quê, em que ordem, e o que vira estado), não sobre o cálculo —
 * que já é coberto nos arquivos das etapas. Se o SensorService virar um
 * MockManual de verdade aqui, o teste passaria a medir a coisas erradas.
 */

import { act, renderHook } from '@testing-library/react-native';
import { useInclination } from '../../core/hooks/useInclination';
import { createSensorService } from '../../core/sensors/SensorService';
import { createFilter } from '../../core/processing/FilterService';
import { toAngles } from '../../core/processing/AngleConverter';
import type { MotionSample } from '../../core/types';
import { motionSample, vec } from '../../test-utils/motion';

jest.mock('../../core/sensors/SensorService', () => ({ createSensorService: jest.fn() }));
jest.mock('../../core/processing/FilterService', () => ({ createFilter: jest.fn() }));
jest.mock('../../core/processing/AngleConverter', () => ({ toAngles: jest.fn() }));

const mockCreateSensorService = createSensorService as unknown as jest.Mock;
const mockCreateFilter = createFilter as unknown as jest.Mock;
const mockToAngles = toAngles as unknown as jest.Mock;

type SampleListener = (sample: MotionSample) => void;

/** Sensor falso: guarda quem está assinando, para checar assinatura duplicada. */
let sensor: {
  listeners: Set<SampleListener>;
  available: boolean;
  start: jest.Mock;
  stop: jest.Mock;
  isAvailable: jest.Mock;
};
let filterProcess: jest.Mock;

/** Emite uma amostra pelo pipeline inteiro, dentro de act. */
const emit = async (sample: MotionSample) => {
  await act(async () => {
    for (const listener of [...sensor.listeners]) listener(sample);
  });
};

const RAW = motionSample({ accelerationIncludingGravity: vec(3.1, -1.4, -9.0), timestamp: 1 });
const FILTERED = motionSample({ accelerationIncludingGravity: vec(2.8, -1.3, -9.3), timestamp: 1 });

beforeEach(() => {
  jest.clearAllMocks();

  sensor = {
    listeners: new Set<SampleListener>(),
    available: true,
    start: jest.fn(async (listener: SampleListener) => { sensor.listeners.add(listener); }),
    stop: jest.fn(() => { sensor.listeners.clear(); }),
    isAvailable: jest.fn(async () => sensor.available),
  };

  filterProcess = jest.fn((sample: MotionSample) => sample);

  mockCreateSensorService.mockReturnValue(sensor);
  mockCreateFilter.mockReturnValue({ process: filterProcess });
  mockToAngles.mockReturnValue({ roll: 0, trim: 0 });
});

const renderInclination = () => renderHook(() => useInclination());

const start = async (result: { current: ReturnType<typeof useInclination> }) => {
  await act(async () => { await result.current.start(); });
};

// ---------------------------------------------------------------------------
// Estado inicial
// ---------------------------------------------------------------------------

describe('useInclination · estado inicial', () => {
  it('começa nivelado, parado, sem calibração e sem erro', () => {
    const { result } = renderInclination();

    expect(result.current.roll).toBe(0);
    expect(result.current.trim).toBe(0);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isCalibrated).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('expoe as três ações', () => {
    const { result } = renderInclination();

    expect(typeof result.current.start).toBe('function');
    expect(typeof result.current.stop).toBe('function');
    expect(typeof result.current.calibrate).toBe('function');
  });

  it('não assina o sensor nem constrói filtro ao montar', () => {
    renderInclination();

    expect(mockCreateSensorService).not.toHaveBeenCalled();
    expect(mockCreateFilter).not.toHaveBeenCalled();
  });

  it('não processa nada enquanto não iniciado', async () => {
    const { result } = renderInclination();
    expect(sensor.listeners.size).toBe(0);

    // Nenhuma assinatura: o evento não tem por onde entrar.
    expect(result.current.roll).toBe(0);
    expect(result.current.trim).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// start / stop
// ---------------------------------------------------------------------------

describe('useInclination · start e stop', () => {
  it('start() liga o sensor e marca isRunning', async () => {
    const { result } = renderInclination();

    await start(result);

    expect(sensor.start).toHaveBeenCalledTimes(1);
    expect(result.current.isRunning).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('stop() desliga o sensor e marca isRunning = false', async () => {
    const { result } = renderInclination();
    await start(result);

    await act(async () => { result.current.stop(); });

    expect(sensor.stop).toHaveBeenCalled();
    expect(result.current.isRunning).toBe(false);
  });

  it('dois start() seguidos não deixam mais de uma assinatura ativa', async () => {
    const { result } = renderInclination();

    await start(result);
    await start(result);

    expect(sensor.listeners.size).toBeLessThanOrEqual(1);
  });

  it('desmontar com o sensor ligado desliga o sensor', async () => {
    const { result, unmount } = renderInclination();
    await start(result);

    unmount();

    expect(sensor.stop).toHaveBeenCalled();
  });

  it('amostras que chegam depois de parar não mudam o estado', async () => {
    const { result } = renderInclination();
    await start(result);
    await emit(RAW);
    await act(async () => { result.current.stop(); });

    const before = { roll: result.current.roll, trim: result.current.trim };
    mockToAngles.mockReturnValue({ roll: 99, trim: 99 });
    await emit(RAW);

    expect({ roll: result.current.roll, trim: result.current.trim }).toEqual(before);
  });
});

// ---------------------------------------------------------------------------
// Orquestração do pipeline
// ---------------------------------------------------------------------------

describe('useInclination · orquestração', () => {
  it('manda a amostra BRUTA do sensor para o filtro', async () => {
    const { result } = renderInclination();
    await start(result);
    filterProcess.mockReturnValue(FILTERED);

    await emit(RAW);

    expect(filterProcess).toHaveBeenCalledTimes(1);
    expect(filterProcess.mock.calls[0][0]).toBe(RAW);
  });

  it('manda a amostra FILTRADA para o conversor', async () => {
    const { result } = renderInclination();
    await start(result);
    filterProcess.mockReturnValue(FILTERED);

    await emit(RAW);

    expect(mockToAngles.mock.calls[0][0]).toBe(FILTERED);
  });

  it('filtra antes de converter', async () => {
    const { result } = renderInclination();
    await start(result);
    filterProcess.mockReturnValue(FILTERED);

    await emit(RAW);

    expect(filterProcess.mock.invocationCallOrder[0])
      .toBeLessThan(mockToAngles.mock.invocationCallOrder[0]);
  });

  it('expõe o resultado do conversor como roll e trim', async () => {
    const { result } = renderInclination();
    await start(result);
    filterProcess.mockReturnValue(FILTERED);
    mockToAngles.mockReturnValue({ roll: 12.5, trim: -3.25 });

    await emit(RAW);

    expect(result.current.roll).toBe(12.5);
    expect(result.current.trim).toBe(-3.25);
  });

  it('acompanha a última amostra do conversor', async () => {
    const { result } = renderInclination();
    await start(result);

    mockToAngles.mockReturnValue({ roll: 1, trim: 1 });
    await emit(RAW);
    mockToAngles.mockReturnValue({ roll: 2, trim: -2 });
    await emit(RAW);
    mockToAngles.mockReturnValue({ roll: 3, trim: 3 });
    await emit(RAW);

    expect(result.current.roll).toBe(3);
    expect(result.current.trim).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Calibração (US-01)
// ---------------------------------------------------------------------------

describe('useInclination · calibração', () => {
  it('calibrate() marca isCalibrated', async () => {
    const { result } = renderInclination();
    await start(result);
    mockToAngles.mockReturnValue({ roll: 4, trim: -2 });
    await emit(RAW);

    await act(async () => { result.current.calibrate(); });

    expect(result.current.isCalibrated).toBe(true);
  });

  it('usa a leitura do instante como offset e a repassa ao conversor', async () => {
    const { result } = renderInclination();
    await start(result);
    filterProcess.mockReturnValue(FILTERED);
    mockToAngles.mockReturnValue({ roll: 4.5, trim: -2.25 });
    await emit(RAW);

    await act(async () => { result.current.calibrate(); });
    mockToAngles.mockClear();
    await emit(RAW);

    expect(mockToAngles).toHaveBeenCalledTimes(1);
    expect(mockToAngles.mock.calls[0][1]).toEqual({ roll: 4.5, trim: -2.25 });
  });

  it('mantém a mesma calibração nas amostras seguintes', async () => {
    const { result } = renderInclination();
    await start(result);
    filterProcess.mockReturnValue(FILTERED);
    mockToAngles.mockReturnValue({ roll: 1, trim: 1 });
    await emit(RAW);
    await act(async () => { result.current.calibrate(); });
    mockToAngles.mockClear();

    await emit(RAW);
    await emit(RAW);
    await emit(RAW);

    expect(mockToAngles.mock.calls.map((call) => call[1]))
      .toEqual([{ roll: 1, trim: 1 }, { roll: 1, trim: 1 }, { roll: 1, trim: 1 }]);
  });

  it('recalibrar substitui o offset anterior', async () => {
    const { result } = renderInclination();
    await start(result);
    filterProcess.mockReturnValue(FILTERED);

    mockToAngles.mockReturnValue({ roll: 5, trim: 1 });
    await emit(RAW);
    await act(async () => { result.current.calibrate(); });

    mockToAngles.mockReturnValue({ roll: 9, trim: -3 });
    await emit(RAW);
    await act(async () => { result.current.calibrate(); });

    mockToAngles.mockClear();
    await emit(RAW);

    expect(mockToAngles.mock.calls[0][1]).toEqual({ roll: 9, trim: -3 });
  });

  it('calibrar antes de iniciar não quebra e marca isCalibrated', async () => {
    const { result } = renderInclination();

    await act(async () => { result.current.calibrate(); });

    expect(result.current.isCalibrated).toBe(true);
    expect(result.current.isRunning).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Erro
//
// HomeScreen chama `void start()`, ou seja: uma rejeição não observada viraria
// unhandled rejection. Por isso o hook NUNCA rejeita — ele captura e publica em
// `error`, que é o que a UI renderiza.
// ---------------------------------------------------------------------------

describe('useInclination · erro', () => {
  it('publica o erro quando o sensor falha, sem rejeitar o start()', async () => {
    sensor.start.mockRejectedValue(new Error('DeviceMotion indisponível'));
    const { result } = renderInclination();

    await act(async () => {
      await expect(result.current.start()).resolves.toBeUndefined();
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error).toContain('DeviceMotion indisponível');
    expect(result.current.isRunning).toBe(false);
  });

  it('publica o erro quando o sensor está indisponível', async () => {
    sensor.available = false;
    sensor.isAvailable.mockResolvedValue(false);
    sensor.start.mockRejectedValue(new Error('Sensor não identificado'));
    const { result } = renderInclination();

    await start(result);

    expect(result.current.error).not.toBeNull();
    expect(result.current.isRunning).toBe(false);
  });

  it('limpa o erro depois de um start bem-sucedido', async () => {
    sensor.start.mockRejectedValueOnce(new Error('falha transitória'));
    const { result } = renderInclination();
    await start(result);
    expect(result.current.error).not.toBeNull();

    await start(result);

    expect(result.current.error).toBeNull();
    expect(result.current.isRunning).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Estabilidade das ações
//
// O teste mais provável de regressão do app inteiro. HomeScreen faz
// `useEffect(() => { void start() }, [start])`: se `start` ganhasse uma
// referência nova a cada render, o efeito re-dispararia para sempre — loop
// infinito de render, sem nenhuma mensagem de erro. Por isso as três ações
// precisam ser estáveis entre renders.
// ---------------------------------------------------------------------------

describe('useInclination · estabilidade das ações', () => {
  it('mantém start, stop e calibrate com a mesma referência entre renders', async () => {
    const { result } = renderInclination();
    const initial = {
      start: result.current.start,
      stop: result.current.stop,
      calibrate: result.current.calibrate,
    };

    await start(result);
    await emit(RAW);
    await act(async () => { result.current.calibrate(); });
    await act(async () => { result.current.stop(); });

    expect(result.current.start).toBe(initial.start);
    expect(result.current.stop).toBe(initial.stop);
    expect(result.current.calibrate).toBe(initial.calibrate);
  });

  it('mantém as ações estáveis mesmo mudando roll e trim a cada amostra', async () => {
    const { result } = renderInclination();
    await start(result);
    const initial = result.current.start;

    for (let i = 0; i < 10; i += 1) {
      mockToAngles.mockReturnValue({ roll: i, trim: -i });
      await emit(RAW);
      expect(result.current.start).toBe(initial);
    }
  });
});
