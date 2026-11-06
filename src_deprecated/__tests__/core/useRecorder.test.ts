/**
 * `useInclination` com a torneira `onSample` — e `useRecorder` do outro lado.
 *
 * O que está travado aqui é o acordo entre as duas pontas:
 *
 * - **Uma amostra alimenta o mostrador e a gravação**, do mesmo
 *   `toAngles`, com o mesmo filtro e a mesma calibração. Um gravador com sensor
 *   próprio gravaria uma série diferente da que o usuário viu.
 * - **A gravação não passa por estado do React.** `onSample` roda dentro do
 *   `handleSample`, e o que ele escreve é buffer e número — nenhum `setState`,
 *   nenhum render.
 * - **O relógio do gravador é o epoch, não o do sensor.** Um é ms desde o boot,
 *   o outro segundos desde o boot; misturar quebraria o eixo x do gráfico.
 * - **As ações continuam sendo as mesmas referências** entre renders, porque o
 *   `Inclinometer` reassina o sensor quando `handleSample` muda.
 */

import { act, renderHook } from '@testing-library/react-native';

import { useInclination } from '../../core/hooks/useInclination';
import { createInMemoryReportRepository } from '../../core/persistence/inMemoryReportRepository';
import { useRecorder, DEFAULT_TICK_MS } from '../../core/recording/useRecorder';
import { poseToGravity, rawMotion } from '../../test-utils/motion';

jest.mock('expo-sensors', () => ({
  DeviceMotion: {
    isAvailableAsync: jest.fn(async () => true),
    setUpdateInterval: jest.fn(),
    addListener: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DeviceMotion } = require('expo-sensors') as typeof import('expo-sensors');
type DeviceMotionMeasurement = import('expo-sensors').DeviceMotionMeasurement;

// É o que o `DeviceMotion.addListener` entrega: o evento cru, ainda com
// timestamp de sensor. A conversão para `MotionSample` é do `SensorService`.
type SampleListener = (measurement: DeviceMotionMeasurement) => void;

const mockDeviceMotion = DeviceMotion as unknown as {
  isAvailableAsync: jest.Mock;
  addListener: jest.Mock;
};

let emit: SampleListener | null = null;

/**
 * Relógio controlado.
 *
 * O `onSample` recebe `Date.now()`, e o intervalo de decimação é de 100 ms — sem
 * um relógio que anda, todas as amostras caem no mesmo milissegundo e a
 * decimação não teria o que decidir.
 */
let clockMs = 1_700_000_000_000;
let realNow: () => number;

function advanceClock(ms: number): void {
  clockMs += ms;
}

beforeEach(() => {
  jest.clearAllMocks();
  emit = null;
  clockMs = 1_700_000_000_000;

  realNow = Date.now;
  Date.now = (): number => clockMs;

  mockDeviceMotion.isAvailableAsync.mockResolvedValue(true);
  mockDeviceMotion.addListener.mockImplementation((listener: SampleListener) => {
    emit = listener;
    return { remove: jest.fn() };
  });
});

afterEach(() => {
  Date.now = realNow;
});

/**
 * Deixa o tique de 100 ms do `useRecorder` passar.
 *
 * O hook **não** publica estado a cada amostra — é o tique que lê o relógio e
 * publica, para o cronômetro e para o gráfico não arrastarem a tela a 60 Hz.
 * Ler `sampleCount` logo depois de um `push` sem esperar o tique mediria o
 * atraso de propósito, não a gravação.
 */
async function tick(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, DEFAULT_TICK_MS + 20));
  });
}

/**
 * Emite uma amostra pelo pipeline completo, como o sensor faria.
 *
 * A pose vem do mesmo `poseToGravity` que o `AngleConverter` inverte, então o
 * `roll`/`trim` que chega no fim do pipeline é o que foi pedido aqui.
 */
function pushAct(roll: number, trim: number): void {
  // O `push` cru chama `setAngles` fora de `act`, e o estado do hook não
  // atualizaria dentro do teste.
  act(() => {
    push(roll, trim);
  });
}

function push(roll: number, trim: number): void {
  if (emit === null) {
    throw new Error('nenhum assinante registrado no DeviceMotion');
  }
  const gravity = poseToGravity(roll, trim);
  // `rawMotion` monta o evento no formato exato do expo-sensors; só o vetor de
  // gravidade e o instante importam aqui, e o resto fica em repouso.
  emit(
    rawMotion({
      accelerationIncludingGravity: { x: gravity.x, y: gravity.y, z: gravity.z, timestamp: clockMs },
    })
  );
}

describe('useInclination · onSample', () => {
  it('entrega cada ângulo calculado, com o instante', async () => {
    const onSample = jest.fn();
    const { result } = renderHook(() => useInclination({ onSample }));

    await act(async () => {
      await result.current.start();
    });

    const before = Date.now();
    pushAct(3, -1);
    const after = Date.now();

    expect(onSample).toHaveBeenCalledTimes(1);
    const [angles, tMs] = onSample.mock.calls[0];
    expect(angles.roll).toBeCloseTo(3, 6);
    expect(angles.trim).toBeCloseTo(-1, 6);
    expect(tMs).toBeGreaterThanOrEqual(before);
    expect(tMs).toBeLessThanOrEqual(after);
  });

  it('entrega o mesmo ângulo que o estado publica', async () => {
    const onSample = jest.fn();
    const { result } = renderHook(() => useInclination({ onSample }));

    await act(async () => {
      await result.current.start();
    });

    pushAct(7, 2);

    expect(onSample.mock.calls[0][0]).toEqual({ roll: result.current.roll, trim: result.current.trim });
  });

  it('entrega o ângulo calibrado, não o bruto', async () => {
    const onSample = jest.fn();
    const { result } = renderHook(() => useInclination({ onSample }));

    await act(async () => {
      await result.current.start();
    });

    pushAct(4, 3);
    const zeroed = onSample.mock.calls[0][0];

    act(() => {
      result.current.calibrate();
    });

    pushAct(4, 3);

    // A calibração é do zero do sensor; com o offset aplicado, a mesma pose
    // agora vale zero. O gravador tem que herdar isso.
    expect(zeroed.roll).toBeCloseTo(4, 6);
    expect(onSample.mock.calls[1][0].roll).toBeCloseTo(0, 6);
  });

  it('não entrega nada antes de start', () => {
    const onSample = jest.fn();
    renderHook(() => useInclination({ onSample }));

    // Sem assinatura do DeviceMotion não há `emit`; o guard do hook é o que
    // impede amostra de aparecer antes do start.
    expect(onSample).not.toHaveBeenCalled();
  });

  it('para de entregar depois de stop', async () => {
    const onSample = jest.fn();
    const { result } = renderHook(() => useInclination({ onSample }));

    await act(async () => {
      await result.current.start();
    });
    act(() => {
      result.current.stop();
    });

    pushAct(3, 1);

    expect(onSample).not.toHaveBeenCalled();
  });

  it('funciona sem nenhuma opção', async () => {
    const { result } = renderHook(() => useInclination());

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.isRunning).toBe(true);
  });

  it('não reassina o sensor quando a referência do onSample muda', async () => {
    // `HomeScreen` monta `<Inclinometer onSample={...}>`; se o `handleSample`
    // dependesse da prop, o efeito do `Inclinometer` reassinaria o sensor a
    // cada render — e a 60 Hz.
    const { result, rerender } = renderHook(
      ({ onSample }: { onSample: (a: unknown, t: number) => void }) => useInclination({ onSample }),
      { initialProps: { onSample: jest.fn() } }
    );

    await act(async () => {
      await result.current.start();
    });
    const subscriptions = mockDeviceMotion.addListener.mock.calls.length;

    rerender({ onSample: jest.fn() });

    expect(mockDeviceMotion.addListener).toHaveBeenCalledTimes(subscriptions);
  });
});

describe('useRecorder', () => {
  /**
   * As duas pontas montadas de verdade: o gravador, e o hook do sensor com a
   * prop `onSample` apontando para o `captureAngle` do gravador — que é
   * exatamente como `HomeScreen` monta na próxima tela.
   */
  function mountRecorder() {
    const repository = createInMemoryReportRepository();
    const recorder = renderHook(() =>
      useRecorder({ repository, sampleIntervalMs: 100, flushIntervalMs: 2000 })
    );
    const sensor = renderHook(() => useInclination({ onSample: recorder.result.current.captureAngle }));

    return { repository, recorder, sensor };
  }

  it('começa em idle, sem tocar no banco', () => {
    const { repository, recorder } = mountRecorder();

    expect(recorder.result.current.mode).toBe('idle');
    expect(recorder.result.current.id).toBeNull();
    expect(recorder.result.current.elapsedMs).toBe(0);
    expect(recorder.result.current.error).toBeNull();
    expect(repository.calls.createRecording).toBe(0);
  });

  it('o captureAngle é a mesma referência em todos os renders', () => {
    const { recorder, sensor } = mountRecorder();
    const before = recorder.result.current.captureAngle;

    sensor.rerender(undefined);
    sensor.rerender(undefined);

    expect(recorder.result.current.captureAngle).toBe(before);
  });

  it('decima: várias amostras no mesmo instante viram uma só', async () => {
    const { recorder, sensor } = mountRecorder();

    await act(async () => {
      await recorder.result.current.start();
    });
    await act(async () => {
      await sensor.result.current.start();
    });

    act(() => {
      for (let i = 0; i < 30; i += 1) {
        push(1 + i * 0.5, -i * 0.2);
      }
    });

    await tick();

    // Trinta amostras do sensor dentro do mesmo milissegundo. A gravação guarda
    // a primeira e descarta as outras 29 — é assim que 60 Hz vira 12 Hz.
    expect(recorder.result.current.sampleCount).toBe(1);
  });

  it('grava a série que o sensor publica, e ela chega ao banco', async () => {
    const { repository, recorder, sensor } = mountRecorder();

    await act(async () => {
      await recorder.result.current.start();
    });
    await act(async () => {
      await sensor.result.current.start();
    });

    // 2 s de fluxo com o relógio andando: dá para passar do intervalo de 100 ms
    // umas 15 vezes, e atravessar o lote de 2 s do repositório.
    act(() => {
      for (let i = 0; i < 120; i += 1) {
        advanceClock(17);
        push((i % 12) - 6, ((i % 5) - 2) * 0.5);
      }
    });

    await tick();

    expect(recorder.result.current.sampleCount).toBeGreaterThanOrEqual(14);
    expect(recorder.result.current.sampleCount).toBeLessThanOrEqual(24);

    // O cabeçalho é zerado ao salvar, então a contagem precisa ser lida antes.
    const { id: recordingId, sampleCount } = recorder.result.current;
    await act(async () => {
      await recorder.result.current.save('Prova');
    });

    const stored = await repository.listSamples(recordingId ?? '');
    expect(stored.length).toBe(sampleCount);
    expect(stored.map((s) => s.elapsedMs)).toEqual(
      [...stored].sort((a, b) => a.elapsedMs - b.elapsedMs).map((s) => s.elapsedMs)
    );
  });

  it('start abre a linha do relatório e devolve um id', async () => {
    const { repository, recorder } = mountRecorder();

    await act(async () => {
      await recorder.result.current.start();
    });

    expect(recorder.result.current.mode).toBe('recording');
    expect(recorder.result.current.id).not.toBeNull();
    expect(repository.calls.createRecording).toBe(1);

    const [interrupted] = await repository.findInterrupted();
    expect(interrupted.status).toBe('recording');
  });

  it('pause e resume andam pelo estado', async () => {
    const { recorder } = mountRecorder();

    await act(async () => {
      await recorder.result.current.start();
    });
    await act(async () => {
      await recorder.result.current.pause();
    });

    expect(recorder.result.current.mode).toBe('paused');

    await act(async () => {
      await recorder.result.current.resume();
    });

    expect(recorder.result.current.mode).toBe('recording');
  });

  it('toggle pausa uma gravação e retoma uma pausada', async () => {
    const { recorder } = mountRecorder();

    await act(async () => {
      await recorder.result.current.start();
    });
    await act(async () => {
      await recorder.result.current.toggle();
    });

    expect(recorder.result.current.mode).toBe('paused');

    await act(async () => {
      await recorder.result.current.toggle();
    });

    expect(recorder.result.current.mode).toBe('recording');
  });

  it('salvar fecha o relatório e volta para idle', async () => {
    const { repository, recorder } = mountRecorder();

    await act(async () => {
      await recorder.result.current.start();
    });
    const recordingId = recorder.result.current.id;

    let saved: string | null = null;
    await act(async () => {
      saved = await recorder.result.current.save('Prova de Inclinação');
    });

    expect(saved).toBe(recordingId);
    expect(recorder.result.current.mode).toBe('idle');

    const reports = await repository.listReports();
    expect(reports).toHaveLength(1);
    expect(reports[0].id).toBe(recordingId);
    expect(reports[0].title).toBe('Prova de Inclinação');
  });

  it('descartar apaga tudo', async () => {
    const { repository, recorder } = mountRecorder();

    await act(async () => {
      await recorder.result.current.start();
    });
    await act(async () => {
      await recorder.result.current.discard();
    });

    expect(recorder.result.current.mode).toBe('idle');
    expect(repository.calls.deleteRecording).toBe(1);
    expect(await repository.findInterrupted()).toEqual([]);
  });

  it('uma falha de gravação vira erro, e não rejeição', async () => {
    const repository = createInMemoryReportRepository();
    repository.failNext('createRecording', new Error('disco cheio'));

    const { result } = renderHook(() => useRecorder({ repository }));

    // `start` é assíncrona e não pode rejeitar: a tela chama `void start()`.
    await act(async () => {
      await expect(result.current.start()).resolves.toBeUndefined();
    });

    expect(result.current.error).toBe('disco cheio');
    expect(result.current.mode).toBe('idle');
  });

  it('o relógio avança em passos, não a cada amostra', async () => {
    const { recorder, sensor } = mountRecorder();

    await act(async () => {
      await recorder.result.current.start();
    });
    await act(async () => {
      await sensor.result.current.start();
    });

    act(() => {
      for (let i = 0; i < 5; i += 1) {
        push(2, 1);
      }
    });

    // Cinco amostras do sensor, com o relógio parado: o cronômetro segue em 0 ms
    // porque quem publica o tempo é o tique, e ele ainda não rodou.
    expect(recorder.result.current.elapsedMs).toBe(0);
  });

  it('a janela do gráfico é limitada, mesmo com a série toda', async () => {
    const { recorder, sensor } = mountRecorder();

    await act(async () => {
      await recorder.result.current.start();
    });
    await act(async () => {
      await sensor.result.current.start();
    });

    await act(async () => {
      for (let i = 0; i < 600; i += 1) {
        advanceClock(17);
        push(i % 20, i % 10);
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    });

    expect(recorder.result.current.samples.length).toBeLessThanOrEqual(240);
  });

  it('desmontar não apaga a gravação', async () => {
    const repository = createInMemoryReportRepository();
    const { result, unmount } = renderHook(() => useRecorder({ repository }));

    await act(async () => {
      await result.current.start();
    });

    unmount();
    await act(async () => {
      await Promise.resolve();
    });

    // Fechar a tela é o gesto mais comum que existe e não pode custar a prova.
    expect(repository.calls.deleteRecording).toBe(0);
    expect(await repository.findInterrupted()).toHaveLength(1);
  });
});