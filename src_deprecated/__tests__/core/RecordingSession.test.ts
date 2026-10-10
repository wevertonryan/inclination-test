/**
 * `RecordingSession` — o que acontece quando o usuário aperta gravar.
 *
 * O que está travado aqui é o que o campo exige e o protótipo promete:
 *
 * - **A gravação tem estado** (`idle | recording | paused`) e o cronômetro
 *   congela na pausa, sem contar o tempo pausado na duração.
 * - **A 60 Hz na tela vira 12 Hz no disco.** É a taxa que o `PROTOTIPO.md`
 *   assume e a que cabe num lote de 2 s sem inflar o banco.
 * - **Um lote não some.** Se a escrita falhar, as linhas voltam para o buffer e
 *   o próximo flush as reenvia, sem duplicar. Um relatório com 20 amostras a
 *   menos do que o cabeçalho afirma é pior do que um relatório atrasado.
 * - **Um app que morre no meio deixa o que já foi gravado.** É a US-07: a linha
 *   nasce `recording`, e `findInterrupted()` a encontra.
 *
 * Tempo e temporizadores são injetados, então nenhum teste espera de verdade.
 */

import {
  createRecordingSession,
  DEFAULT_FLUSH_INTERVAL_MS,
  DEFAULT_SAMPLE_INTERVAL_MS,
  IDLE_SESSION_STATE,
} from '../../core/recording/RecordingSession';
import type { RecorderScheduler } from '../../core/recording/RecordingSession';
import { createInMemoryReportRepository } from '../../core/persistence/inMemoryReportRepository';
import type { InMemoryReportRepository } from '../../core/persistence/inMemoryReportRepository';
import type { Angles, ReportSample } from '../../core/types';

const T0 = 1_700_000_000_000;
const SAMPLE_INTERVAL_MS = 100;
const FLUSH_INTERVAL_MS = 2000;

/** Relógio controlado: `now()` é o que a sessão lê. */
function createClock(startMs = T0) {
  let current = startMs;
  return {
    now: (): number => current,
    advance(ms: number): void {
      current += ms;
    },
  };
}

/**
 * Temporizador controlado. `tick()` dispara o que estiver armado — o papel do
 * `setInterval` de 2 s, sem esperar 2 s.
 */
function createFakeScheduler() {
  let nextId = 1;
  const armed = new Map<number, () => void>();

  const scheduler: RecorderScheduler = {
    setInterval(handler: () => void): unknown {
      const id = nextId;
      nextId += 1;
      armed.set(id, handler);
      return id;
    },
    clearInterval(handle: unknown): void {
      armed.delete(handle as number);
    },
  };

  return {
    scheduler,
    get armedCount(): number {
      return armed.size;
    },
    tick(): void {
      for (const handler of [...armed.values()]) {
        handler();
      }
    },
  };
}

/** Deixa as promessas do flush pendentes assentarem. */
function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function angles(roll: number, trim: number): Angles {
  return { roll, trim };
}

interface Harness {
  session: ReturnType<typeof createRecordingSession>;
  repository: InMemoryReportRepository;
  clock: ReturnType<typeof createClock>;
  timers: ReturnType<typeof createFakeScheduler>;
  errors: Error[];
  /** Emite uma amostra como o `useInclination` faria, com o relógio andando. */
  feed(roll: number, trim: number, advanceMs?: number): void;
  /** Emite `count` amostras a 60 Hz (16,67 ms), a taxa real do mostrador. */
  feedAt60Hz(count: number, startRoll?: number): void;
  /** Espera o flush automático e deixa tudo assentar. */
  autoFlush(): Promise<void>;
}

function createHarness(overrides: Partial<Parameters<typeof createRecordingSession>[0]> = {}): Harness {
  const repository = createInMemoryReportRepository();
  const clock = createClock();
  const timers = createFakeScheduler();
  const errors: Error[] = [];

  const session = createRecordingSession({
    repository,
    sampleIntervalMs: SAMPLE_INTERVAL_MS,
    flushIntervalMs: FLUSH_INTERVAL_MS,
    now: clock.now,
    createId: () => 'rec-1',
    scheduler: timers.scheduler,
    onError: (cause) => errors.push(cause),
    ...overrides,
  });

  return {
    session,
    repository,
    clock,
    timers,
    errors,
    feed(roll, trim, advanceMs = SAMPLE_INTERVAL_MS) {
      clock.advance(advanceMs);
      session.capture(angles(roll, trim), clock.now());
    },
    feedAt60Hz(count, startRoll = 0) {
      for (let i = 0; i < count; i += 1) {
        // 17 ms em vez de 1000/60: `Date.now()` é inteiro num aparelho, e a
        // série gravada tem `elapsed_ms` inteiro.
        clock.advance(17);
        session.capture(angles(startRoll + i * 0.1, i * 0.05), clock.now());
      }
    },
    async autoFlush() {
      timers.tick();
      await settle();
    },
  };
}

describe('RecordingSession · estado inicial', () => {
  it('começa em idle, sem gravação e sem amostras', () => {
    const { session } = createHarness();

    expect(session.mode).toBe('idle');
    expect(session.id).toBeNull();
    expect(session.elapsedMs).toBe(0);
    expect(session.sampleCount).toBe(0);
    expect(session.bufferedCount).toBe(0);
    expect(session.samples).toEqual([]);
  });

  it('o estado inicial declarado bate com uma sessão recém-criada', () => {
    const { session } = createHarness();

    expect(session.mode).toBe(IDLE_SESSION_STATE.mode);
    expect(session.id).toBe(IDLE_SESSION_STATE.id);
    expect(session.roll).toEqual(IDLE_SESSION_STATE.roll);
    expect(session.trim).toEqual(IDLE_SESSION_STATE.trim);
  });

  it('descarta amostras antes de começar', async () => {
    const { session, repository } = createHarness();

    session.capture(angles(12, -3), T0 + 50);
    session.capture(angles(15, -1), T0 + 200);

    expect(session.sampleCount).toBe(0);
    expect(session.bufferedCount).toBe(0);
    expect(repository.calls.appendSamples).toBe(0);
  });

  it('ignora um start() enquanto já está gravando', async () => {
    const { session, repository } = createHarness();

    await session.start();
    await session.start();

    expect(repository.calls.createRecording).toBe(1);
  });
});

describe('RecordingSession · decimação', () => {
  it('guarda ~12 Hz de um fluxo de 60 Hz', async () => {
    const { session, feedAt60Hz } = createHarness();
    await session.start();

    feedAt60Hz(60);

    // 1 s de fluxo a 60 Hz contra o intervalo configurado no harness (100 ms): a
    // primeira amostra sempre entra, depois só passa quem está a 100 ms ou mais
    // da anterior. O default de 83 ms tem teste próprio, em "defaults".
    expect(session.sampleCount).toBeGreaterThanOrEqual(9);
    expect(session.sampleCount).toBeLessThanOrEqual(11);
  });

  it('nunca grava duas amostras com o mesmo elapsed', async () => {
    const { session, repository, feedAt60Hz } = createHarness();
    await session.start();

    feedAt60Hz(180);
    await session.flush();

    const stored = await repository.listSamples('rec-1');
    expect(stored.length).toBeGreaterThan(15);
    expect(new Set(stored.map((s) => s.elapsedMs)).size).toBe(stored.length);
  });

  it('descarta amostras com o mesmo instante ou fora de ordem', async () => {
    const { session } = createHarness();
    await session.start();

    session.capture(angles(1, 0), T0 + 100);
    // Mesmo ms: violaria a metade da PK de `samples`.
    session.capture(angles(2, 0), T0 + 100);
    // Relógio andou para trás (NTP, ou o usuário mudou a hora do aparelho).
    session.capture(angles(3, 0), T0 + 50);

    expect(session.sampleCount).toBe(1);
    expect(session.samples[0].roll).toBe(1);
  });

  it('descarta um instante não finito', async () => {
    const { session } = createHarness();
    await session.start();

    session.capture(angles(1, 0), Number.NaN);

    expect(session.sampleCount).toBe(0);
  });

  it('elapsed é relativo ao início da gravação, não ao epoch', async () => {
    const { session, clock } = createHarness();
    await session.start();

    clock.advance(1500);
    session.capture(angles(4, 1), clock.now());

    expect(session.samples[0].elapsedMs).toBe(1500);
    expect(session.samples[0].tMs).toBe(T0 + 1500);
  });
});

describe('RecordingSession · relógio e estados', () => {
  it('o cronômetro anda enquanto grava', async () => {
    const { session, clock } = createHarness();
    await session.start();

    clock.advance(5000);

    expect(session.mode).toBe('recording');
    expect(session.elapsedMs).toBe(5000);
  });

  it('a pausa congela o cronômetro e para de aceitar amostras', async () => {
    const { session, clock, feed } = createHarness();
    await session.start();
    clock.advance(3000);
    await session.pause();

    clock.advance(9000);
    feed(10, 2);

    expect(session.mode).toBe('paused');
    expect(session.elapsedMs).toBe(3000);
    expect(session.sampleCount).toBe(0);
  });

  it('retomar continua de onde parou, sem contar o tempo pausado', async () => {
    const { session, clock, feed } = createHarness();
    await session.start();

    clock.advance(2000);
    await session.pause();
    clock.advance(60000);
    await session.resume();
    clock.advance(1000);

    expect(session.mode).toBe('recording');
    expect(session.elapsedMs).toBe(3000);

// `advanceMs: 0`: o instante da leitura é o da retomada, e o eixo x tem que
// estar em 3000 — os 60 s de pausa não entram.
feed(7, 1, 0);
expect(session.samples[0].elapsedMs).toBe(3000);
  });

  it('a duração não anda enquanto está pausado', async () => {
    const { session, clock, repository } = createHarness();
    await session.start();
    clock.advance(4000);
    await session.pause();
    clock.advance(50000);
    await session.save('Prova');

    const [report] = await repository.listReports();
    expect(report.durationMs).toBe(4000);
  });

  it('pausar duas vezes não soma o tempo duas vezes', async () => {
    const { session, clock } = createHarness();
    await session.start();

    clock.advance(1000);
    await session.pause();
    clock.advance(1000);
    await session.pause();
    await session.resume();
    clock.advance(500);

    expect(session.elapsedMs).toBe(1500);
  });

  it('retomar antes de começar não faz nada', async () => {
    const { session } = createHarness();

    await session.resume();

    expect(session.mode).toBe('idle');
  });
});

describe('RecordingSession · lotes', () => {
  it('o flush escreve as amostras e as medidas', async () => {
    const { session, repository, feed } = createHarness();
    await session.start();

    feed(2, 1);
    feed(4, 3);
    await session.flush();

    expect(repository.calls.appendSamples).toBe(1);
    expect(repository.calls.updateRecordingStats).toBe(1);
    expect(session.bufferedCount).toBe(0);
  });

  it('o lote automático dispara no intervalo configurado', async () => {
    const { session, repository, clock, feed, autoFlush } = createHarness();
    await session.start();

    feed(2, 1);
    expect(repository.calls.appendSamples).toBe(0);

    clock.advance(FLUSH_INTERVAL_MS);
    await autoFlush();

    expect(repository.calls.appendSamples).toBe(1);
    expect(repository.sampleRowCount()).toBe(1);
  });

  it('pausar esvazia o buffer no disco', async () => {
    const { session, repository, clock, feed } = createHarness();
    await session.start();

    feed(2, 1);
    feed(4, 3);
    await session.pause();

    expect(repository.calls.appendSamples).toBe(1);
    expect(repository.sampleRowCount()).toBe(2);
  });

  it('não arma flush com buffer vazio', async () => {
    const { session, repository, timers } = createHarness();
    await session.start();

    timers.tick();
    await settle();

    expect(repository.calls.appendSamples).toBe(0);
  });

  it('flush sem nada pendente não toca no banco', async () => {
    const { session, repository } = createHarness();
    await session.start();

    await session.flush();
    await session.flush();

    expect(repository.calls.appendSamples).toBe(0);
  });

  it('as amostras gravadas saem em ordem de elapsed', async () => {
    const { session, repository, feed } = createHarness();
    await session.start();

    for (let i = 1; i <= 5; i += 1) {
      feed(i, -i);
    }
    await session.flush();

    const stored = await repository.listSamples('rec-1');
    expect(stored.map((s) => s.elapsedMs)).toEqual([100, 200, 300, 400, 500]);
    expect(stored.map((s) => s.roll)).toEqual([1, 2, 3, 4, 5]);
  });

  it('o cabeçalho carrega a média, o desvio e a contagem', async () => {
    const { session, repository, feed } = createHarness();
    await session.start();

    feed(2, 0);
    feed(4, 0);
    feed(6, 0);
    await session.flush();

    const [interrupted] = await repository.findInterrupted();
    expect(interrupted.sampleCount).toBe(3);
    expect(interrupted.roll.mean).toBe(4);
    expect(interrupted.roll.max - interrupted.roll.min).toBe(4);
    expect(interrupted.trim.mean).toBe(0);
  });

  it('não escreve duas vezes quando dois chamadores pedem flush no mesmo instante', async () => {
    const { session, repository, feed } = createHarness();
    await session.start();

    feed(1, 0);
    // O timer de 2 s e um `pause()` podem pedir flush no mesmo instante.
    await Promise.all([session.flush(), session.flush()]);
    await settle();

    expect(repository.calls.appendSamples).toBe(1);
    expect(repository.sampleRowCount()).toBe(1);
  });
});

describe('RecordingSession · falha de escrita', () => {
  it('devolve as linhas ao buffer e reenvia no próximo flush', async () => {
    const { session, repository, feed } = createHarness();
    await session.start();

    feed(2, 1);
    feed(4, 3);
    repository.failNext('appendSamples', new Error('disco cheio'));

    await expect(session.flush()).rejects.toThrow('disco cheio');

    expect(session.bufferedCount).toBe(2);

    await session.flush();

    expect(repository.sampleRowCount()).toBe(2);
    expect(session.bufferedCount).toBe(0);
  });

  it('não duplica as amostras no retry', async () => {
    const { session, repository, feed } = createHarness();
    await session.start();

    feed(2, 1);
    repository.failNext('appendSamples', new Error('falha'));
    await expect(session.flush()).rejects.toThrow();

    feed(6, 5);
    await session.flush();

    const stored = await repository.listSamples('rec-1');
    // A chave `(recording_id, elapsed_ms)` faz o reenvio sobrescrever.
    expect(stored.map((s) => s.roll)).toEqual([2, 6]);
  });

  it('o flush automático não vira unhandled rejection', async () => {
    const { session, repository, feed, timers, errors } = createHarness();
    await session.start();

    feed(2, 1);
    repository.failNext('appendSamples', new Error('disco cheio'));
    timers.tick();
    await settle();

    expect(errors.map((e) => e.message)).toEqual(['disco cheio']);
  });

  it('recupera sozinho no flush seguinte', async () => {
    const { session, repository, feed, timers } = createHarness();
    await session.start();

    feed(2, 1);
    repository.failNext('appendSamples', new Error('falha'));
    timers.tick();
    await settle();

    timers.tick();
    await settle();

    expect(repository.sampleRowCount()).toBe(1);
  });

  it('descarta as mais antigas quando a série retida estoura o teto', async () => {
    const { session, feed } = createHarness({ maxRetainedSamples: 5, sampleIntervalMs: 0 });
    await session.start();

    for (let i = 1; i <= 8; i += 1) {
      feed(i, 0);
    }

    expect(session.samples).toHaveLength(5);
    expect(session.bufferedCount).toBe(5);
    expect(session.droppedCount).toBe(3);
    // As mais recentes sobrevivem — as três últimas são o que importa.
    expect(session.samples.map((s) => s.roll)).toEqual([4, 5, 6, 7, 8]);
  });

  it('o teto só perde o que ainda não tinha ido para o disco', async () => {
    const { session, repository, feed } = createHarness({ maxRetainedSamples: 3, sampleIntervalMs: 0 });
    await session.start();

    feed(1, 0);
    feed(2, 0);
    await session.flush();
    expect(session.bufferedCount).toBe(0);

    for (let i = 3; i <= 6; i += 1) {
      feed(i, 0);
    }

    // O cursor recua junto com o descarte, então o próximo lote não reenvia o
    // que já está no disco. E o contador de perdas olha só para a fatia
    // pendente: das 3 linhas que saíram da janela, só a 3 foi realmente perdida.
    expect(session.bufferedCount).toBe(3);
    expect(session.droppedCount).toBe(1);

    await session.flush();

    // s1 e s2 do primeiro lote, mais s4/s5/s6. A s3 foi capturada e descartada
    // pela janela antes de chegar ao disco.
    expect(repository.sampleRowCount()).toBe(5);
  });

  it('recentSamples devolve a janela mais recente, e nada além', async () => {
    const { session, feed } = createHarness({ sampleIntervalMs: 0 });
    await session.start();

    for (let i = 1; i <= 10; i += 1) {
      feed(i, 0);
    }

    expect(session.recentSamples(3).map((s) => s.roll)).toEqual([8, 9, 10]);
    expect(session.recentSamples(50)).toHaveLength(10);
    expect(session.recentSamples(0)).toEqual([]);
  });
});

describe('RecordingSession · salvar', () => {
  it('finaliza o relatório e volta para idle', async () => {
    const { session, repository, feed } = createHarness();
    await session.start();

    feed(3, 1);
    const id = await session.save('Prova de Inclinação');

    expect(id).toBe('rec-1');
    expect(session.mode).toBe('idle');
    expect(session.id).toBeNull();
    expect(session.sampleCount).toBe(0);

    const [report] = await repository.listReports();
    expect(report.title).toBe('Prova de Inclinação');
    expect(report.status).toBe('saved');
    expect(report.sampleCount).toBe(1);
  });

  it('salvar esvazia o buffer antes de fechar', async () => {
    const { session, repository, feed } = createHarness();
    await session.start();

    feed(3, 1);
    feed(5, 2);
    await session.save('Prova');

    expect(repository.sampleRowCount()).toBe(2);
    expect(repository.calls.finalizeRecording).toBe(1);
  });

  it('grava finished_at e a duração final', async () => {
    const { session, repository, clock } = createHarness();
    await session.start();

    clock.advance(7500);
    await session.save('Prova');

    const [report] = await repository.listReports();
    expect(report.durationMs).toBe(7500);
    expect(report.finishedAt).toBe(T0 + 7500);
  });

  it('salvando a partir de paused congela o relógio', async () => {
    const { session, repository, clock } = createHarness();
    await session.start();

    clock.advance(2000);
    await session.pause();
    clock.advance(30000);
    await session.save('Prova');

    const [report] = await repository.listReports();
    expect(report.durationMs).toBe(2000);
    expect(repository.sampleRowCount()).toBe(0);
  });

  it('salvar sem gravação devolve null', async () => {
    const { session, repository } = createHarness();

    await expect(session.save('Sem gravação')).resolves.toBeNull();
    expect(repository.calls.finalizeRecording).toBe(0);
  });

  it('permite gravar de novo depois de salvar', async () => {
    const ids = (() => {
      let n = 0;
      return (): string => {
        n += 1;
        return `rec-${n}`;
      };
    })();

    const { session, repository, clock } = createHarness({ createId: ids });

    await session.start();
    clock.advance(4000);
    await session.save('Primeira');

    await session.start();
    clock.advance(4000);
    await session.save('Segunda');

    const reports = await repository.listReports();
    expect(reports.map((r) => r.title)).toEqual(['Segunda', 'Primeira']);
  });
});

describe('RecordingSession · cancelar', () => {
  it('apaga a gravação e a série, sem finalizar nada', async () => {
    const { session, repository, feed } = createHarness();
    await session.start();

    feed(3, 1);
    await session.discard();

    expect(session.mode).toBe('idle');
    expect(repository.calls.deleteRecording).toBe(1);
    expect(repository.calls.finalizeRecording).toBe(0);
    expect(repository.sampleRowCount()).toBe(0);
    expect(await repository.listReports()).toEqual([]);
    expect(await repository.findInterrupted()).toEqual([]);
  });

  it('descarta o buffer que não chegou a ir para o disco', async () => {
    const { session, repository, feed } = createHarness();
    await session.start();

    feed(3, 1);
    feed(5, 2);
    await session.discard();

    expect(session.bufferedCount).toBe(0);
    expect(repository.calls.appendSamples).toBe(0);
  });

  it('cancelar sem gravação não toca no banco', async () => {
    const { session, repository } = createHarness();

    await session.discard();

    expect(repository.calls.deleteRecording).toBe(0);
  });
});

describe('RecordingSession · queda do app no meio (US-07)', () => {
  it('suspender deixa a linha como recording, recuperável', async () => {
    const { session, repository, clock, feed } = createHarness();
    await session.start();

    clock.advance(1000);
    feed(3, 1);
    feed(6, 2);
    await session.suspend();

    const interrupted = await repository.findInterrupted();
    expect(interrupted).toHaveLength(1);
    expect(interrupted[0].status).toBe('recording');
    expect(interrupted[0].sampleCount).toBe(2);
    expect(await repository.listSamples('rec-1')).toHaveLength(2);
  });

  it('o que não chegou ao lote não é prometido', async () => {
    const { session, repository, feed, timers } = createHarness();
    await session.start();

    feed(3, 1);
    await session.suspend();

    // O lote de 2 s não rodou: só o que foi para o disco conta.
    expect(timers.armedCount).toBe(0);
    expect(await repository.listSamples('rec-1')).toHaveLength(1);
  });

  it('o timer do flush é solto ao pausar, retomar e suspender', async () => {
    const { session, timers } = createHarness();

    await session.start();
    expect(timers.armedCount).toBe(1);

    await session.pause();
    expect(timers.armedCount).toBe(0);

    await session.resume();
    expect(timers.armedCount).toBe(1);

    await session.suspend();
    expect(timers.armedCount).toBe(0);
  });

  it('uma gravação salva some da recuperação', async () => {
    const { session, repository } = createHarness();
    await session.start();
    await session.save('Prova');

    expect(await repository.findInterrupted()).toEqual([]);
    expect(await repository.listReports()).toHaveLength(1);
  });

  it('a linha nasce com started_at e interval_ms, para a recuperação fazer sentido', async () => {
    const { session, repository } = createHarness();
    await session.start();

    const [report] = await repository.findInterrupted();
    expect(report.startedAt).toBe(T0);
    expect(report.intervalMs).toBe(SAMPLE_INTERVAL_MS);
    expect(report.finishedAt).toBeNull();
    expect(report.title).toBe('');
  });
});

describe('RecordingSession · assinantes', () => {
  it('avisa nas mudanças de estado, e o que importa não é o count de cada passo', async () => {
    const { session, clock, timers } = createHarness();
    const states: string[] = [];
    session.subscribe((state) => states.push(state.mode));

    await session.start();
    clock.advance(1000);
    await session.pause();
    await session.resume();
    await session.save('Prova');

    expect(states).toEqual(['recording', 'paused', 'recording', 'idle']);
    expect(timers.armedCount).toBe(0);
  });

  it('cada amostra não vira um aviso', async () => {
    const { session, feedAt60Hz } = createHarness();
    await session.start();

    let notices = 0;
    session.subscribe(() => {
      notices += 1;
    });

    feedAt60Hz(300);

    // A 60 Hz com notificação por amostra seriam 300 renders de tela por
    // segundo. A contagem é lida no tique do cronômetro de qualquer forma.
    expect(notices).toBe(0);
  });

  it('sair da assinatura para de entregar estado', async () => {
    const { session } = createHarness();
    const seen: string[] = [];
    const unsubscribe = session.subscribe((state) => seen.push(state.mode));

    await session.start();
    unsubscribe();
    await session.pause();

    expect(seen).toEqual(['recording']);
  });

  it('entrega falhas de escrita a quem assina erros', async () => {
    const { session, repository, feed, timers } = createHarness();
    await session.start();

    const seen: string[] = [];
    session.subscribeErrors((error) => seen.push(error.message));

    feed(1, 1);
    repository.failNext('appendSamples', new Error('disco cheio'));
    timers.tick();
    await settle();

    expect(seen).toEqual(['disco cheio']);
  });
});

describe('RecordingSession · defaults', () => {
  it('usa 83 ms entre amostras (12 Hz) e 2 s de lote', () => {
    expect(DEFAULT_SAMPLE_INTERVAL_MS).toBe(83);
    expect(DEFAULT_FLUSH_INTERVAL_MS).toBe(2000);
  });

  it('o default de 83 ms mesmo entrega ~12 Hz, sem ninguém configurar nada', async () => {
    const repository = createInMemoryReportRepository();
    const clock = createClock();
    const timers = createFakeScheduler();
    const session = createRecordingSession({
      repository,
      now: clock.now,
      createId: () => 'rec-1',
      scheduler: timers.scheduler,
    });
    await session.start();

    // 2 s de fluxo a 60 Hz contra o default — a conta que a doc promete.
    for (let i = 0; i < 120; i += 1) {
      clock.advance(17);
      session.capture(angles(i * 0.1, i * 0.05), clock.now());
    }

    // 83 ms em 2000 ms de fluxo: 24 amostras, mais a primeira.
    expect(session.sampleCount).toBeGreaterThanOrEqual(23);
    expect(session.sampleCount).toBeLessThanOrEqual(25);
  });

  it('funciona sem nenhuma opção além do repositório', async () => {
    const repository = createInMemoryReportRepository();
    const session = createRecordingSession({ repository });

    await session.start();
    session.capture(angles(1, 1), Date.now());

    expect(session.mode).toBe('recording');
    expect(session.sampleCount).toBe(1);
  });
});