/**
 * ViewModel do gravador: a ponte entre a `RecordingSession` e o React.
 *
 * A sessão (`core/recording/RecordingSession.ts`) é um objeto comum: recebe
 * ângulos, guarda em buffer, escreve no disco. Este hook é o que a tela
 * consome, e ele cuida de três coisas que são de interface, não de domínio:
 *
 * 1. **Um tique para ler o relógio.** O cronômetro mostra milésimos
 *    (`formatStopwatch`, `00:00 · 000`), mas a sessão só muda de estado em
 *    `start`/`pause`/`resume`/`save`. Um `setInterval` de 100 ms aqui lê
 *    `session.elapsedMs` e publica — é o que impede que o relógio ande a 60 Hz
 *    e arraste a tela inteira junto.
 * 2. **A sessão sobrevive ao re-render.** Ela é criada uma vez, num ref, porque
 *    uma sessão nova a cada render zeraria o buffer e o id da gravação.
 * 3. **Nada de rejeição não observada.** A tela chama `void start()`; o erro vai
 *    para `error`, como no `useInclination`.
 *
 * ## Quem alimenta a sessão
 *
 * `captureAngle` é passado ao `Inclinometer` pela prop `onSample`, que o
 * componente entrega ao `useInclination`. A cadeia é
 *
 * ```
 * DeviceMotion → SensorService → FilterService → AngleConverter
 *   → useInclination.handleSample → onSample(angles, tMs)
 *   → captureAngle → session.capture
 * ```
 *
 * Só existe **um** sensor, **um** filtro e **uma** calibração no app inteiro —
 * a mesma restrição que impede a `HomeScreen` de consumir o hook diretamente.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { createReportRepository } from '../persistence/RecordingStore';
import type { ReportRepository } from '../persistence/ReportRepository';
import { createRecordingSession } from './RecordingSession';
import type { RecordingSession, RecordingSessionState } from './RecordingSession';
import { IDLE_SESSION_STATE } from './RecordingSession';
import type { Angles, RecordingMode, ReportSample } from '../types';

/**
 * De quanto em quanto tempo a tela é avisada do que mudou.
 *
 * 100 ms alinha o cronômetro (`· 000`, milésimos) e dá 10 renders por segundo
 * para o card "Trim × Roll" — bem abaixo da taxa na qual o React Native começa
 * a aparecer. A gravação em si não passa por aqui: a 12 Hz ela viraria 12
 * renders por segundo do gráfico, com o `Inclinometer` dentro da mesma
 * subárvore.
 */
export const DEFAULT_TICK_MS = 100;

/**
 * Quantos pontos o card "Trim × Roll" guarda em tela.
 *
 * O gráfico desenha uma linha crescente (`PROTOTIPO.md`), mas em React Native
 * cada ponto é um `d` num `<path>`: 20 mil pontos seriam 20 mil elementos SVG
 * reconciliados a cada tique. 240 pontos a 12 Hz são 20 s de janela — o bastante
 * para o usuário ver o barco responder, e um custo de render que não aparece.
 */
export const LIVE_CHART_POINTS = 240;

export interface UseRecorderOptions {
  /**
   * Repositório. Injetado para os testes; em produção, o SQLite do app.
   * A criação é preguiçosa: nada toca no disco antes de o usuário gravar.
   */
  repository?: ReportRepository;
  /** Espera o repositório estar pronto antes de abrir a gravação. */
  resolveRepository?: () => Promise<ReportRepository>;
  /** Intervalo entre amostras gravadas. */
  sampleIntervalMs?: number;
  /** De quanto em quanto tempo o lote vai para o disco. */
  flushIntervalMs?: number;
  /** Frequência de atualização do cronômetro e do gráfico ao vivo. */
  tickMs?: number;
  /** Localização já resolvida. `null` quando o GPS está desligado. */
  location?: string | null;
}

export interface UseRecorderResult extends RecordingSessionState {
  /** A janela mais recente da série, do tamanho de `LIVE_CHART_POINTS`. */
  readonly samples: readonly ReportSample[];
  /** Última falha de escrita. `null` quando está tudo bem. */
  readonly error: string | null;
  /**
   * Referência estável para a prop `onSample` do `Inclinometer`.
   *
   * A estabilidade não é preciosismo: o `Inclinometer` a repassa para o
   * `useInclination`, que a instala num efeito. Uma referência nova a cada
   * render re-dispararia esse efeito 60 vezes por segundo.
   */
  captureAngle: (angles: Angles, tMs: number) => void;
  start: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  toggle: () => Promise<void>;
  save: (title: string) => Promise<string | null>;
  discard: () => Promise<void>;
}

/**
 * Lê o repositório na primeira gravação.
 *
 * Abrir o SQLite custa alguns milissegundos de I/O e não há ganho nenhum em
 * fazê-lo na montagem da tela — o app não grava nada antes de o usuário pedir.
 */
function defaultRepository(): Promise<ReportRepository> {
  return createReportRepository();
}

export function useRecorder(options: UseRecorderOptions = {}): UseRecorderResult {
  const {
    repository,
    resolveRepository = defaultRepository,
    location = null,
    tickMs = DEFAULT_TICK_MS,
  } = options;

  const [state, setState] = useState<RecordingSessionState>(IDLE_SESSION_STATE);
  const [error, setError] = useState<string | null>(null);
  const [chart, setChart] = useState<readonly ReportSample[]>([]);

  const sessionRef = useRef<RecordingSession | null>(null);
  /** Só é resolvido na primeira gravação; depois disso é a sessão que importa. */
  const repositoryRef = useRef<ReportRepository | null>(repository ?? null);
  const optionsRef = useRef({ sampleIntervalMs: options.sampleIntervalMs, flushIntervalMs: options.flushIntervalMs, location });
  optionsRef.current = { sampleIntervalMs: options.sampleIntervalMs, flushIntervalMs: options.flushIntervalMs, location };

  const publish = useCallback((): void => {
    const session = sessionRef.current;
    if (session === null) {
      setState(IDLE_SESSION_STATE);
      setChart([]);
      return;
    }
    setState({
      mode: session.mode,
      id: session.id,
      elapsedMs: session.elapsedMs,
      sampleCount: session.sampleCount,
      bufferedCount: session.bufferedCount,
      droppedCount: session.droppedCount,
      roll: session.roll,
      trim: session.trim,
    });
    // A janela, não a série inteira: a linha do gráfico cresce, e a tela só
    // precisa do que ainda cabe nela.
    setChart(session.recentSamples(LIVE_CHART_POINTS));
  }, []);

  /** Cria a sessão na primeira vez, e só uma vez por mount. */
  const ensureSession = useCallback((): RecordingSession | null => {
    if (sessionRef.current !== null) {
      return sessionRef.current;
    }

    const store = repositoryRef.current;
    if (store === null) {
      return null;
    }

    const session = createRecordingSession({
      repository: store,
      sampleIntervalMs: optionsRef.current.sampleIntervalMs,
      flushIntervalMs: optionsRef.current.flushIntervalMs,
      location: optionsRef.current.location,
    });

    // Uma assinatura só para as falhas: `createRecordingSession` recebe o
    // `onError` para quem não assina, e aqui a assinatura cobre o mesmo caminho
    // sem duplicar o `setError`.
    session.subscribe(publish);
    session.subscribeErrors((cause) => {
      setError(cause.message);
    });

    sessionRef.current = session;
    return session;
  }, [publish]);

  /**
   * Caminho de 60 Hz.
   *
   * Só uma comparação de modo antes de empurrar: quando não está gravando, o
   * custo é o de ler um booleano. E o objeto de ângulos nunca é clonado — ele
   * já vem novo do `AngleConverter` a cada amostra.
   */
  const captureAngle = useCallback((angles: Angles, tMs: number): void => {
    sessionRef.current?.capture(angles, tMs);
  }, []);

  const start = useCallback(async (): Promise<void> => {
    try {
      if (repositoryRef.current === null) {
        repositoryRef.current = repository ?? (await resolveRepository());
      }

      const session = ensureSession();
      if (session === null) {
        return;
      }

      setError(null);
      await session.start();
      publish();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao iniciar a gravação');
    }
  }, [ensureSession, publish, repository, resolveRepository]);

  const pause = useCallback(async (): Promise<void> => {
    const session = sessionRef.current;
    if (session === null) {
      return;
    }

    try {
      await session.pause();
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao pausar a gravação');
    }
    publish();
  }, [publish]);

  const resume = useCallback(async (): Promise<void> => {
    const session = sessionRef.current;
    if (session === null) {
      return;
    }

    try {
      await session.resume();
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao retomar a gravação');
    }
    publish();
  }, [publish]);

  const toggle = useCallback(async (): Promise<void> => {
    if (sessionRef.current?.mode === 'recording') {
      await pause();
      return;
    }
    await resume();
  }, [pause, resume]);

  const save = useCallback(
    async (title: string): Promise<string | null> => {
      const session = sessionRef.current;
      if (session === null) {
        return null;
      }

      try {
        const id = await session.save(title);
        setError(null);
        publish();
        return id;
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Falha ao salvar a gravação');
        publish();
        return null;
      }
    },
    [publish]
  );

  const discard = useCallback(async (): Promise<void> => {
    const session = sessionRef.current;
    if (session === null) {
      return;
    }

    try {
      await session.discard();
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao cancelar a gravação');
    }
    publish();
  }, [publish]);

  /**
   * O tique do relógio.
   *
   * Só existe enquanto há gravação: em `idle` ele não renderiza nada, e uma
   * tela parada não deve ter um timer rodando. O `setInterval` do hook roda na
   * thread do JS e só lê — não escreve em buffer, não toca no disco.
   */
  useEffect(() => {
    if (state.mode === 'idle') {
      return;
    }

    const handle = setInterval(publish, tickMs);
    return () => clearInterval(handle);
  }, [publish, state.mode, tickMs]);

  /**
   * Desmontar **não** apaga a gravação.
   *
   * Solta o timer e esvazia o buffer no disco; a linha fica com
   * `status = 'recording'` e aparece em `findInterrupted()` na volta do app.
   * Apagar aqui seria o oposto da US-07: fechar a tela é o gesto mais comum
   * que existe, e não pode custar a prova.
   */
  useEffect(() => {
    return () => {
      const session = sessionRef.current;
      sessionRef.current = null;
      if (session !== null) {
        void session.suspend();
      }
    };
  }, []);

  return {
    ...state,
    error,
    samples: chart,
    captureAngle,
    start,
    pause,
    resume,
    toggle,
    save,
    discard,
  };
}
