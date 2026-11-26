/**
 * A máquina de gravação: estados, decimação, batches e relógio.
 *
 * É a peça que responde "o que acontece quando o usuário aperta gravar". Ela é
 * um objeto comum, sem React, sem sensor e sem `setState` — recebe ângulos
 * prontos por `capture()` e escreve no repositório. Quem a liga ao React é o
 * `useRecorder`, e quem a alimenta é o `useInclination`, via a prop `onSample`
 * do `Inclinometer`.
 *
 * ## O caminho de uma amostra
 *
 * ```
 * capture(angles, tMs)        a 60 Hz, sem tocar em nada
 *   ├─ mode !== 'recording'        → descarta
 *   ├─ tMs <= última tMs           → descarta (relógio andou para trás)
 *   ├─ tMs − última tMs < intervalo → descarta (decimação 60 Hz → 12 Hz)
 *   ├─ captured.push(...)           ← só um objeto
 *   ├─ statistics.add(...)         ← só dois floats
 *   └─ (não avisa ninguém: quem lê o relógio é o tique da UI, a 10 Hz)
 * ```
 *
 * Nada disso aloca além do objeto da amostra, e nada disso passa por estado do
 * React. É o que permite gravar sem arrastar a tela junto: a 60 Hz, o caminho
 * inteiro é três comparações e um `push`.
 *
 * ## Por que o intervalo de flush é de 2 s
 *
 * Porque é o que separa "gravar" de "ter o resultado" quando o celular apaga.
 * Com o lote de 2 s, uma queda de energia custa no máximo 2 s de prova — e as
 * medidas do cabeçalho estão atualizadas junto, porque `updateRecordingStats`
 * vai no mesmo lote (`US-07`, `README.md`).
 *
 * ## Por que o relógio é `Date.now()`
 *
 * `MotionSample.timestamp` é o timestamp do sensor: no Android, milissegundos
 * desde o boot; no iOS, do `DeviceMotion`, **segundos** desde o boot. Misturar
 * os dois-produziria um `elapsed_ms` sem sentido. `Date.now()` é epoch nos dois,
 * monotônico o suficiente para medir e ordenado — e é o mesmo relógio da
 * `started_at` do relatório, então o eixo x do gráfico bate com a data da prova.
 */

import type { ReportRepository } from '../persistence/ReportRepository';
import { createAngleStatistics } from './Statistics';
import type { AngleStatisticsPair } from './Statistics';
import type { AngleStatistics, Angles, RecordingMode, ReportSample } from '../types';

/**
 * 12 Hz — a taxa que o protótipo usa (`proto/src/data/useSensor.js`: `HZ = 12`).
 *
 * O mostrador roda a 60 Hz porque o olho precisa de 60; o disco não. 12 Hz dá
 * 83 ms entre amostras, ou 720 amostras por prova de 60 s — granularity suficiente
 * para ver o barco adernando e o porão alagando, e um terço do custo do bruto.
 *
 * Não arredonda para 100 ms: isso seria 10 Hz, não 12, e mudaria a conta de
 * "1 s de fluxo vira ~12 amostras" que a documentação promete.
 */
export const DEFAULT_SAMPLE_INTERVAL_MS = Math.round(1000 / 12);

/** Lote de 2 s, como no plano: o máximo que uma queda de energia pode custar. */
export const DEFAULT_FLUSH_INTERVAL_MS = 2000;

/**
 * Teto da série retida em memória.
 *
 * Serve para duas coisas ao mesmo tempo, e é por isso que é um número só:
 *
 * - **Se o disco falhar**, o lote pendente não cresce sem parar. Sem teto, duas
 *   horas a 12 Hz com o armazenamento cheio acumulariam ~86 mil objetos até o
 *   celular travar — e um app que morre sem aviso no meio da prova é pior do
 *   que um app que perde o começo de um gráfico.
 * - **Se a prova for longa**, o gráfico ao vivo não precisa do começo. Ele lê
 *   uma janela (`recentSamples`), e o começo continua no disco.
 *
 * 60 mil amostras a 12 Hz é mais de uma hora e meia de retido.
 */
export const DEFAULT_MAX_RETAINED_SAMPLES = 60000;

/** Relógio e temporizadores injetáveis, para os testes dirigirem o tempo. */
export interface RecorderScheduler {
  setInterval(handler: () => void, ms: number): unknown;
  clearInterval(handle: unknown): void;
}

const systemScheduler: RecorderScheduler = {
  setInterval: (handler, ms) => setInterval(handler, ms),
  clearInterval: (handle) => clearInterval(handle as ReturnType<typeof setInterval>),
};

export interface RecordingSessionOptions {
  repository: ReportRepository;
  /** Intervalo nominal entre amostras gravadas. 100 = ~12 Hz. */
  sampleIntervalMs?: number;
  /** De quanto em quanto tempo o buffer vai para o disco. */
  flushIntervalMs?: number;
  /** Relógio. Injetado para os testes; em produção, `Date.now`. */
  now?: () => number;
  /** Gerador de id do relatório. */
  createId?: () => string;
  /** Temporizador do flush. */
  scheduler?: RecorderScheduler;
  /** Texto de localização já resolvido; `null` quando o GPS está desligado. */
  location?: string | null;
  /** Teto da série retida em memória. Vale para o lote pendente e para o gráfico. */
  maxRetainedSamples?: number;
  /**
   * Falha de escrita no disco.
   *
   * O `flush()` do timer não tem quemcapture a rejeição — um `void` sem catch
   * seria uma unhandled rejection, e um celular com o armazenamento cheio
   * derrubaria o app. O `flush()` chamado à mão continua rejeitando; este
   * callback é só para o timer, que não tem retorno.
   */
  onError?: (cause: Error) => void;
}

export interface RecordingSessionState {
  readonly mode: RecordingMode;
  /** `null` enquanto não há gravação. */
  readonly id: string | null;
  /** Tempo ativo já decorrido, sem o tempo pausado. Base do cronômetro. */
  readonly elapsedMs: number;
  readonly sampleCount: number;
  /** Amostras que ainda não foram para o disco. */
  readonly bufferedCount: number;
  /**
   * Amostras capturadas que não chegaram a ser gravadas porque a série retida
   * em memória bateu o teto. Zero no uso normal — só é não-zero com o disco
   * indisponível por muito tempo, ou numa prova que passe de ~1h30.
   */
  readonly droppedCount: number;
  readonly roll: AngleStatistics;
  readonly trim: AngleStatistics;
}

export interface RecordingSession extends RecordingSessionState {
  /** Tudo que foi capturado nesta gravação, inclusive o que já foi para o disco. */
  readonly samples: readonly ReportSample[];

  /** Abre a gravação: insere a linha do relatório e arma o timer de flush. */
  start(): Promise<void>;
  /** Congela o relógio e o fluxo de amostras; esvazia o buffer no disco. */
  pause(): Promise<void>;
  /** Retoma de onde parou. Não cria linha nova nem zera medidas. */
  resume(): Promise<void>;
  /** Recebe um par de ângulos filtrados e calibrados, a 60 Hz. */
  capture(angles: Angles, tMs: number): void;
  /**
   * A janela mais recente da série, para o gráfico ao vivo.
   *
   * O gráfico não quer a série inteira: ele desenha uma linha crescente e,
   * depois de meia hora, ler 20 mil pontos a 10 Hz seria trabalho jogado fora.
   * Quem chama escolhe o tamanho — a UI usa uma constante.
   */
  recentSamples(max: number): readonly ReportSample[];
  /** Esvazia o buffer no disco agora. Idempotente. */
  flush(): Promise<void>;
  /** Fecha o relatório: título, `finished_at` e `status = 'saved'`. Devolve o id. */
  save(title: string): Promise<string | null>;
  /** Apaga a gravação e a série. Devolve ao estado inicial. */
  discard(): Promise<void>;
  /** Solta o timer e esvazia o buffer, **sem** apagar nem finalizar. */
  suspend(): Promise<void>;
  /** Assina mudanças de estado (modo, contagem, erro). Devolve a função de sair. */
  subscribe(listener: (state: RecordingSessionState) => void): () => void;
  /** Assina falhas de escrita do flush automático. Devolve a função de sair. */
  subscribeErrors(listener: (error: Error) => void): () => void;
}

function noopId(): string {
  // `randomUUID` existe no Hermes moderno e no Node 18+; o sufixo cobre o caso
  // de não existir, onde ainda assim o id só precisa ser único no aparelho.
  const random = typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return random;
}

export function createRecordingSession(options: RecordingSessionOptions): RecordingSession {
  const repository = options.repository;
  const now = options.now ?? ((): number => Date.now());
  const createId = options.createId ?? noopId;
  const scheduler = options.scheduler ?? systemScheduler;
  const location = options.location ?? null;

  const sampleIntervalMs = options.sampleIntervalMs ?? DEFAULT_SAMPLE_INTERVAL_MS;
  const flushIntervalMs = options.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS;
  const maxRetainedSamples = options.maxRetainedSamples ?? DEFAULT_MAX_RETAINED_SAMPLES;
  const onError = options.onError;

  let mode: RecordingMode = 'idle';
  let recordingId: string | null = null;
  let startedAtTMs = 0;
  /** Acumulado dos trechos já pausados, somado ao trecho corrente. */
  let accumulatedMs = 0;
  /** Relógio do trecho `recording` corrente; `null` quando não está gravando. */
  let runStartedAtTMs: number | null = null;

  /**
   * Tudo que foi capturado nesta gravação, em ordem de `elapsed_ms`.
   *
   * E `buffered` — a fatia `[flushedCount, length)` — que é o que ainda não foi
   * para o disco. Um array só com um cursor, em vez de dois arrays e uma
   * remontagem: um flush que falha não precisa devolver nada, basta não mover
   * o cursor, e a ordem das linhas é a ordem em que entraram por construção.
   */
  let captured: ReportSample[] = [];
  let flushedCount = 0;
  let dropped = 0;
  let lastKeptTMs: number | null = null;

  let flushHandle: unknown = null;
  let flushing: Promise<void> | null = null;

  const statistics: AngleStatisticsPair = createAngleStatistics();
  const listeners = new Set<(state: RecordingSessionState) => void>();
  const errorListeners = new Set<(error: Error) => void>();

  function snapshot(): RecordingSessionState {
    return {
      mode,
      id: recordingId,
      elapsedMs: elapsedMs(),
      sampleCount: statistics.count,
      bufferedCount: captured.length - flushedCount,
      droppedCount: dropped,
      roll: statistics.roll.snapshot(),
      trim: statistics.trim.snapshot(),
    };
  }

  /**
   * Tempo **ativo** decorrido até um instante dado: o que está gravando agora,
   * mais o que já foi acumulado antes das pausas.
   *
   * É o eixo x do gráfico, e por isso é tempo ativo e não tempo de parede. Um
   * `elapsed_ms` de parede produziria um trecho morto no gráfico durante a
   * pausa — e um trecho morto parece um dado, quando na verdade é ausência de
   * dado. O instante real continua em `t_ms`, então a linha do tempo absoluta
   * é recuperável. O que oPause congela é o relógio, e `duration_ms` usa a mesma
   * conta: o gráfico e o "Tempo registrado" não podem discordar.
   */
  function activeElapsedAt(tMs: number): number {
    if (runStartedAtTMs === null) {
      return accumulatedMs;
    }
    return accumulatedMs + Math.max(0, tMs - runStartedAtTMs);
  }

  function elapsedMs(): number {
    return activeElapsedAt(now());
  }

  function notify(): void {
    const state = snapshot();
    for (const listener of listeners) {
      listener(state);
    }
  }

  function clearFlushTimer(): void {
    if (flushHandle !== null) {
      scheduler.clearInterval(flushHandle);
      flushHandle = null;
    }
  }

  function armFlushTimer(): void {
    clearFlushTimer();
    flushHandle = scheduler.setInterval(() => {
      void flush().catch(reportError);
    }, flushIntervalMs);
  }

  function reportError(cause: unknown): void {
    const error = cause instanceof Error ? cause : new Error(String(cause));
    for (const listener of errorListeners) {
      listener(error);
    }
    onError?.(error);
  }

  /** Escreve o cabeçalho acumulado: contagem, duração e as medidas dos dois eixos. */
  async function writeStats(id: string): Promise<void> {
    await repository.updateRecordingStats(id, {
      sampleCount: statistics.count,
      durationMs: elapsedMs(),
      roll: statistics.roll.snapshot(),
      trim: statistics.trim.snapshot(),
    });
  }

  async function flush(): Promise<void> {
    if (recordingId === null || flushedCount >= captured.length) {
      return;
    }

    // Serializa os flushes. O timer de 2 s e um `pause()` podem pedir um flush
    // ao mesmo tempo, e dois lotes indo para o mesmo statement ao mesmo tempo
    // dariam `database is locked`.
    if (flushing !== null) {
      return flushing;
    }

    const id = recordingId;
    const from = flushedCount;
    const to = captured.length;

    const run = (async () => {
      try {
        await repository.appendSamples(id, captured.slice(from, to));
        await writeStats(id);
        // O cursor só anda depois que as duas escritas passaram. Uma falha no
        // `writeStats` devolve as linhas para o lote pendente de graça, e o
        // próximo flush reenvia um `INSERT OR REPLACE` que não duplica nada.
        flushedCount = to;
      } catch (cause) {
        throw cause;
      } finally {
        flushing = null;
      }
    })();

    flushing = run;
    notify();
    return run;
  }

  function capture(angles: Angles, tMs: number): void {
    if (mode !== 'recording' || recordingId === null) {
      return;
    }

    // Relógio andou para trás ou repetiu: descarta. Também garante que
    // `elapsed_ms`, que é a metade da PK de `samples`, nunca colide — o
    // intervalo mínimo já é de 100 ms, então dois `tMs` iguais são
    // impossíveis a partir daqui.
    if (!Number.isFinite(tMs) || (lastKeptTMs !== null && tMs <= lastKeptTMs)) {
      return;
    }

    // Ângulo não finito também é descartado, e por um motivo concreto: o SQLite
    // guarda `NaN` como `NULL`, que bate na coluna `NOT NULL` de `samples` e
    // derruba o lote inteiro. O mostrador tem o mesmo problema e resolve com um
    // `finiteOr` — o `AngleConverter` produz `NaN` quando a gravidade chega
    // suja, e isso é raro o bastante para ser invisível num relatório.
    if (!Number.isFinite(angles.roll) || !Number.isFinite(angles.trim)) {
      return;
    }

    if (lastKeptTMs !== null && tMs - lastKeptTMs < sampleIntervalMs) {
      return;
    }

    lastKeptTMs = tMs;

    captured.push({
      elapsedMs: activeElapsedAt(tMs),
      tMs,
      roll: angles.roll,
      trim: angles.trim,
    });

    statistics.roll.add(angles.roll);
    statistics.trim.add(angles.trim);

    if (captured.length > maxRetainedSamples) {
      // Estouro do teto. As mais antigas do *lote pendente* são as que se perdem
      // de verdade; as já gravadas só somem da janela do gráfico e continuam no
      // disco. O cursor anda junto, senão o próximo flush reenviaria linhas que
      // já estão lá.
      const excess = captured.length - maxRetainedSamples;
      const alreadyFlushed = flushedCount;
      captured.splice(0, excess);
      flushedCount = Math.max(0, alreadyFlushed - excess);
      // Só conta como perdida a parte que ainda não tinha ido para o disco —
      // `droppedCount` responde "perdi leitura?", não "o gráfico recomeçou?".
      dropped += Math.max(0, excess - alreadyFlushed);
      notify();
    }
  }

  async function start(): Promise<void> {
    if (mode !== 'idle') {
      return;
    }

    const id = createId();
    const startTMs = now();

    await repository.createRecording({
      id,
      title: '',
      startedAt: startTMs,
      location,
      intervalMs: sampleIntervalMs,
    });

    recordingId = id;
    startedAtTMs = startTMs;
    accumulatedMs = 0;
    runStartedAtTMs = startTMs;
    captured = [];
    flushedCount = 0;
    dropped = 0;
    lastKeptTMs = null;
    statistics.reset();

    mode = 'recording';
    armFlushTimer();
    notify();
  }

  async function pause(): Promise<void> {
    if (mode !== 'recording' || runStartedAtTMs === null) {
      return;
    }

    accumulatedMs += Math.max(0, now() - runStartedAtTMs);
    runStartedAtTMs = null;
    mode = 'paused';

    clearFlushTimer();
    await flush();
    notify();
  }

  async function resume(): Promise<void> {
    if (mode !== 'paused' || recordingId === null) {
      return;
    }

    runStartedAtTMs = now();
    mode = 'recording';
    armFlushTimer();
    notify();
  }

  async function save(title: string): Promise<string | null> {
    if (recordingId === null || mode === 'idle') {
      return null;
    }

    // Congela o relógio antes do último flush: o `duration_ms` gravado tem que
    // ser o tempo até o fim da gravação, não até a próxima iteração do timer.
    if (mode === 'recording' && runStartedAtTMs !== null) {
      accumulatedMs += Math.max(0, now() - runStartedAtTMs);
      runStartedAtTMs = null;
    }

    clearFlushTimer();
    await flush();

    const id = recordingId;
    // O cabeçalho é reescrito mesmo com o buffer vazio: se as últimas amostras
    // já tinham ido num flush anterior, é este `writeStats` que grava a duração
    // final. Sem ele, um relatório de 3 s terminado em pausa ficaria com
    // `duration_ms = 0`.
    await writeStats(id);
    await repository.finalizeRecording(id, title, now());

    mode = 'idle';
    recordingId = null;
    captured = [];
    flushedCount = 0;
    lastKeptTMs = null;
    statistics.reset();
    notify();

    return id;
  }

  async function discard(): Promise<void> {
    if (recordingId === null) {
      reset();
      return;
    }

    const id = recordingId;
    clearFlushTimer();
    reset();

    // O `DELETE` vem depois do reset: se ele falhar, a sessão já está em `idle`
    // e a linha órfã aparece em `findInterrupted()`, de onde dá para apagar.
    await repository.deleteRecording(id);
  }

  async function suspend(): Promise<void> {
    if (mode === 'idle') {
      return;
    }
    clearFlushTimer();
    await flush();
  }

  function reset(): void {
    mode = 'idle';
    recordingId = null;
    startedAtTMs = 0;
    accumulatedMs = 0;
    runStartedAtTMs = null;
    captured = [];
    flushedCount = 0;
    dropped = 0;
    lastKeptTMs = null;
    statistics.reset();
    notify();
  }

  return {
    capture,

    start,
    pause,
    resume,
    flush,
    save,
    discard,
    suspend,

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    subscribeErrors(listener) {
      errorListeners.add(listener);
      return () => {
        errorListeners.delete(listener);
      };
    },

    get mode(): RecordingMode {
      return mode;
    },
    get id(): string | null {
      return recordingId;
    },
    get elapsedMs(): number {
      return elapsedMs();
    },
    get sampleCount(): number {
      return statistics.count;
    },
    get bufferedCount(): number {
      return captured.length - flushedCount;
    },
    get droppedCount(): number {
      return dropped;
    },
    get samples(): readonly ReportSample[] {
      return captured;
    },

    recentSamples(max: number): readonly ReportSample[] {
      if (max <= 0) {
        return [];
      }
      return captured.length <= max ? captured : captured.slice(captured.length - max);
    },
    get roll(): AngleStatistics {
      return statistics.roll.snapshot();
    },
    get trim(): AngleStatistics {
      return statistics.trim.snapshot();
    },
  };
}

/** Estado inicial, para quem precisar comparar sem instanciar uma sessão. */
export const IDLE_SESSION_STATE: RecordingSessionState = {
  mode: 'idle',
  id: null,
  elapsedMs: 0,
  sampleCount: 0,
  bufferedCount: 0,
  droppedCount: 0,
  roll: { mean: 0, std: 0, min: 0, max: 0 },
  trim: { mean: 0, std: 0, min: 0, max: 0 },
};