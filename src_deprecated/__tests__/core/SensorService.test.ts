/**
 * Contrato do SensorService — a etapa que traduz o evento do expo-sensors na
 * MotionSample que o FilterService consome.
 *
 * A fronteira que este arquivo trava é a conversão de forma (W3C → MotionSample),
 * não a leitura de hardware: o DeviceMotion é mockado, e é justamente por isso
 * que esta etapa é testável sem emulador. O que não pode passar é
 *
 *   - a taxa de amostragem errada (a doc fixa 60 Hz para visualização ao vivo)
 *   - o mapeamento de rotation/rotationRate para Vector3
 *   - o tratamento de campos null, que o expo declara como possíveis
 *   - uma assinatura que vaza quando start/stop são chamados fora de ordem
 */

import { createSensorService } from '../../core/sensors/SensorService';
import { DeviceMotion } from 'expo-sensors';
import type { DeviceMotionMeasurement } from 'expo-sensors';
import type { MotionSample } from '../../core/types';
import { G, rawMotion } from '../../test-utils/motion';

jest.mock('expo-sensors', () => ({
  DeviceMotion: {
    addListener: jest.fn(),
    setUpdateInterval: jest.fn(),
    isAvailableAsync: jest.fn(),
  },
}));

type MotionListener = (event: DeviceMotionMeasurement) => void;

const deviceMotion = DeviceMotion as unknown as {
  addListener: jest.Mock;
  setUpdateInterval: jest.Mock;
  isAvailableAsync: jest.Mock;
};

/** Listeners com assinatura ainda ativa — o que decide se um evento é entregue. */
let active: Set<MotionListener>;
let subscriptions: Array<{ remove: jest.Mock }>;
let onSample: jest.Mock<void, [MotionSample]>;

const deliver = (event: DeviceMotionMeasurement) => {
  for (const listener of [...active]) listener(event);
};

beforeEach(() => {
  jest.clearAllMocks();
  active = new Set();
  subscriptions = [];
  onSample = jest.fn();

  deviceMotion.isAvailableAsync.mockResolvedValue(true);
  deviceMotion.addListener.mockImplementation((listener: MotionListener) => {
    active.add(listener);
    const subscription = { remove: jest.fn(() => { active.delete(listener); }) };
    subscriptions.push(subscription);
    return subscription;
  });
});

afterEach(() => {
  active.clear();
});

// ---------------------------------------------------------------------------
// Assinatura e taxa de amostragem
// ---------------------------------------------------------------------------

describe('createSensorService · assinatura', () => {
  it('assina o DeviceMotion exatamente uma vez ao iniciar', async () => {
    const service = createSensorService();

    await service.start(onSample);

    expect(deviceMotion.addListener).toHaveBeenCalledTimes(1);
  });

  it('pede 60 Hz por padrão (1000/60 ms entre amostras)', async () => {
    const service = createSensorService();

    await service.start(onSample);

    expect(deviceMotion.setUpdateInterval).toHaveBeenCalledTimes(1);
    expect(deviceMotion.setUpdateInterval).toHaveBeenCalledWith(1000 / 60);
  });

  it('respeita updateIntervalMs informado nas options', async () => {
    const service = createSensorService({ updateIntervalMs: 100 });

    await service.start(onSample);

    expect(deviceMotion.setUpdateInterval).toHaveBeenCalledWith(100);
  });

  it('configura a taxa ANTES de assinar, para não perder a janela inicial', async () => {
    const service = createSensorService();

    await service.start(onSample);

    const intervalCall = deviceMotion.setUpdateInterval.mock.invocationCallOrder[0];
    const listenerCall = deviceMotion.addListener.mock.invocationCallOrder[0];
    expect(intervalCall).toBeLessThan(listenerCall);
  });

  it('iniciar duas vezes deixa no máximo uma assinatura ativa', async () => {
    const service = createSensorService();

    await service.start(onSample);
    await service.start(onSample);

    expect(active.size).toBeLessThanOrEqual(1);
  });

  it('parar cancela a assinatura e a entrega de eventos', async () => {
    const service = createSensorService();
    await service.start(onSample);

    service.stop();

    expect(subscriptions[0].remove).toHaveBeenCalledTimes(1);
    expect(active.size).toBe(0);

    deliver(rawMotion());
    expect(onSample).not.toHaveBeenCalled();
  });

  it('parar sem ter iniciado não quebra', () => {
    const service = createSensorService();

    expect(() => service.stop()).not.toThrow();
    expect(deviceMotion.addListener).not.toHaveBeenCalled();
  });

  it('reiniciar volta a entregar eventos', async () => {
    const service = createSensorService();
    await service.start(onSample);
    service.stop();

    await service.start(onSample);
    deliver(rawMotion());

    expect(onSample).toHaveBeenCalledTimes(1);
  });

  it('reencaminha todos os eventos, na ordem, sem perder nenhum', async () => {
    const service = createSensorService();
    await service.start(onSample);

    const events = [
      rawMotion({ accelerationIncludingGravity: { x: 1, y: 0, z: -G, timestamp: 10 } }),
      rawMotion({ accelerationIncludingGravity: { x: 2, y: 0, z: -G, timestamp: 20 } }),
      rawMotion({ accelerationIncludingGravity: { x: 3, y: 0, z: -G, timestamp: 30 } }),
    ];
    for (const event of events) deliver(event);

    expect(onSample).toHaveBeenCalledTimes(3);
    expect(onSample.mock.calls.map(([s]) => s.timestamp)).toEqual([10, 20, 30]);
  });
});

// ---------------------------------------------------------------------------
// Disponibilidade
// ---------------------------------------------------------------------------

describe('createSensorService · disponibilidade', () => {
  it('isAvailable() reflete o expo-sensors', async () => {
    deviceMotion.isAvailableAsync.mockResolvedValue(true);
    await expect(createSensorService().isAvailable()).resolves.toBe(true);

    deviceMotion.isAvailableAsync.mockResolvedValue(false);
    await expect(createSensorService().isAvailable()).resolves.toBe(false);
  });

  it('não assina nada quando o sensor está indisponível', async () => {
    deviceMotion.isAvailableAsync.mockResolvedValue(false);
    const service = createSensorService();

    await expect(service.start(onSample)).rejects.toBeDefined();
    expect(deviceMotion.addListener).not.toHaveBeenCalled();
    expect(active.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Conversão de forma: DeviceMotionMeasurement → MotionSample
// ---------------------------------------------------------------------------

describe('createSensorService · conversão de forma', () => {
  const startWith = async () => {
    const service = createSensorService();
    await service.start(onSample);
    return service;
  };

  it('entrega uma MotionSample com exatamente as 4 chaves do contrato', async () => {
    await startWith();

    deliver(rawMotion());
    const sample = onSample.mock.calls[0][0];

    expect(Object.keys(sample).sort()).toEqual([
      'accelerationIncludingGravity',
      'rotation',
      'rotationRate',
      'timestamp',
    ]);
  });

  it('copia accelerationIncludingGravity como está', async () => {
    await startWith();

    deliver(rawMotion({
      accelerationIncludingGravity: { x: 1.25, y: -2.5, z: -9.0, timestamp: 5 },
    }));

    const { accelerationIncludingGravity } = onSample.mock.calls[0][0];
    expect(accelerationIncludingGravity).toEqual({ x: 1.25, y: -2.5, z: -9.0 });
  });

  it('mapeia rotation {alpha, beta, gamma} para Vector3 {x, y, z}', async () => {
    await startWith();

    deliver(rawMotion({ rotation: { alpha: 0.1, beta: 0.2, gamma: 0.3, timestamp: 5 } }));

    expect(onSample.mock.calls[0][0].rotation).toEqual({ x: 0.1, y: 0.2, z: 0.3 });
  });

  it('mapeia rotationRate {alpha, beta, gamma} para Vector3 {x, y, z}', async () => {
    await startWith();

    deliver(rawMotion({ rotationRate: { alpha: 1.5, beta: -2.5, gamma: 3.5, timestamp: 5 } }));

    expect(onSample.mock.calls[0][0].rotationRate).toEqual({ x: 1.5, y: -2.5, z: 3.5 });
  });

  it('substitui campos null por vetor zero, sem quebrar', async () => {
    await startWith();

    expect(() =>
      deliver(rawMotion({ acceleration: null, rotationRate: null })),
    ).not.toThrow();

    const sample = onSample.mock.calls[0][0];
    expect(sample.rotationRate).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('usa o timestamp do próprio sensor quando ele existe', async () => {
    await startWith();

    deliver(rawMotion({ accelerationIncludingGravity: { x: 0, y: 0, z: -G, timestamp: 1_234_567 } }));

    expect(onSample.mock.calls[0][0].timestamp).toBe(1_234_567);
  });

  it('cai para Date.now() quando o timestamp do sensor não é utilizável', async () => {
    const spy = jest.spyOn(Date, 'now').mockReturnValue(999_000);
    await startWith();

    deliver(rawMotion({
      accelerationIncludingGravity: { x: 0, y: 0, z: -G, timestamp: Number.NaN },
    }));
    deliver(rawMotion({
      accelerationIncludingGravity: { x: 0, y: 0, z: -G, timestamp: Number.POSITIVE_INFINITY },
    }));

    expect(onSample.mock.calls.map(([s]) => s.timestamp)).toEqual([999_000, 999_000]);
    spy.mockRestore();
  });

  it('entrega objetos próprios, sem vazar o evento mutável do expo', async () => {
    await startWith();
    const event = rawMotion();

    deliver(event);
    const sample = onSample.mock.calls[0][0];

    expect(sample).not.toBe(event as unknown as MotionSample);
    expect(sample.accelerationIncludingGravity).not.toBe(event.accelerationIncludingGravity);

    // Se o filtro reusar o objeto do expo, um bug de normalização aqui viraria
    // corrupção silenciosa duas etapas adiante.
    // MotionSample é readonly por contrato, então o teste é que a amostra
    // devolvida é um objeto próprio exige mutá-la por baixo do readonly.
    const returned = sample.accelerationIncludingGravity as { x: number; y: number; z: number };
    returned.x = 12345;
    expect(event.accelerationIncludingGravity.x).toBe(0);
  });
});
