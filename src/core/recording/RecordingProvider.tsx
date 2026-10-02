/**
 * O gravador como estado compartilhado (`DESIGN.md` §7.1).
 *
 * ## Por que isto precisa existir
 *
 * A `RecordingBar` mora em `App.tsx`, ao lado da `NavBar` que ela substitui
 * (§6.3), mas o botão que **inicia** a gravação mora na `HomeScreen`. Os dois
 * precisam do mesmo `mode`, e não podem instanciar o gravador cada um: duas
 * instâncias são duas sessões, dois lotes e duas linhas em `recordings`.
 *
 * A `NavBar` só é trocada durante a gravação, então ninguém navega para fora da
 * Home no meio de uma prova — o diálogo de confirmação, que fica na Home, sempre
 * tem quem o mostre.
 *
 * ## Por que o pedido de confirmação também mora aqui
 *
 * O botão `X` está na `RecordingBar` (dentro do `App.tsx`) e o diálogo está na
 * `HomeScreen`. Se o estado ficasse na tela, o `App` teria que abrir um diálogo
 * que não é dele. Guardar o pedido aqui é o que mantém cada componente com uma
 * única responsabilidade: `App` desenha a barra, `Home` desenha o diálogo, e
 * nenhum dos dois conhece o detalhe do outro.
 *
 * ## Por que são DOIS contextos
 *
 * O `useRecorder` publica a 10 Hz (`tickMs`), e a cada publicação ele devolve um
 * objeto novo. Com um contexto só, **todo** consumidor re-renderizava a 10 Hz —
 * incluindo `App.Shell`, e portanto a `NavBar` e a `RecordingBar`, que só precisam
 * do `mode`. Isso é trabalho inútil no caminho mais quente do app.
 *
 * A divisão é por frequência, não por 화면:
 *
 * | Contexto | Conteúdo | Muda quando |
 * |---|---|---|
 * | `RecordingContext` | `mode`, `error`, `request`, as ações, `captureAngle` | troca de estado — raramente |
 * | `RecordingStreamContext` | `elapsedMs`, `samples`, contadores | a 10 Hz, durante a gravação |
 *
 * `App.Shell` usa `useRecordingControl()` e therefore para de re-renderizar a
 * 10 Hz; `HomeScreen` usa `useRecording()` e continua seguindo o fluxo, que é o
 * que o cronômetro e o gráfico ao vivo precisam.
 *
 * ## O valor padrão do contexto
 *
 * É um gravador `idle` **inerte**, não um erro. O `HomeScreen.test.tsx` monta a
 * tela sozinha, sem o provider, e um `throw` aqui derrubaria essa suíte — que
 * existe justamente para travar a arquitetura da tela. O aviso em `__DEV__` cobre
 * o caso real de alguém esquecer o provider: no app ele está no `App.tsx`, três
 * linhas acima de `<Shell />`, e nenhum outro lugar monta tela.
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { createAngleStatistics } from './Statistics';
import { useRecorder, type UseRecorderOptions, type UseRecorderResult } from './useRecorder';
import type { ReportSample } from '../types';

/**
 * Qual confirmação a gravação está esperando. `'none'` é o estado normal — o
 * usuário não pediu nada e a `RecordingBar` age direto.
 */
export type RecordingRequest = 'none' | 'cancel' | 'save';

/**
 * A parte que muda a 10 Hz. Só o que se move durante a gravação, separado para
 * que a casca não pague por ele (ver "Por que são DOIS contextos" acima).
 */
export interface RecordingStream {
  readonly elapsedMs: number;
  readonly samples: readonly ReportSample[];
  readonly sampleCount: number;
  readonly bufferedCount: number;
  readonly droppedCount: number;
  readonly roll: UseRecorderResult['roll'];
  readonly trim: UseRecorderResult['trim'];
}

/** A parte estável: o que a casca e os diálogos precisam. */
export interface RecordingControl {
  readonly mode: UseRecorderResult['mode'];
  readonly id: string | null;
  readonly error: string | null;
  /** Referência estável — é a prop `onSample` do `Inclinometer`. */
  readonly captureAngle: UseRecorderResult['captureAngle'];
  readonly start: UseRecorderResult['start'];
  readonly pause: UseRecorderResult['pause'];
  readonly resume: UseRecorderResult['resume'];
  readonly toggle: UseRecorderResult['toggle'];
  readonly save: UseRecorderResult['save'];
  readonly discard: UseRecorderResult['discard'];
  /** A confirmação aberta, se alguma. */
  readonly request: RecordingRequest;
  /** Pede a confirmação de descarte (chamado pelo `X` da `RecordingBar`). */
  requestCancel: () => void;
  /** Pede a confirmação de salvamento (chamado pelo `✓` da `RecordingBar`). */
  requestSave: () => void;
  /** Fecha o pedido sem gravar nem descartar. O botão "Voltar" dos diálogos. */
  dismissRequest: () => void;
  /** Descarta a gravação. Fecha o diálogo só se o disco deixou apagar. */
  confirmCancel: () => Promise<void>;
  /** Salva com o título informado. Mantém o diálogo aberto se a escrita falhar. */
  confirmSave: (title: string) => Promise<void>;
}

/** O que a tela consome: os dois lados da stream e do controle. */
export interface RecordingContextValue extends RecordingControl, RecordingStream {}

const empty = createAngleStatistics();
const NOOP = async (): Promise<void> => {};

/**
 * Gravador inerte. Só o `mode` interessa aqui: a tela renderiza um botão de
 * gravar que não grava, e o usuário vê isso na próxima build.
 */
const INERT_CONTROL: RecordingControl = {
  mode: 'idle',
  id: null,
  error: null,
  captureAngle: NOOP,
  start: NOOP,
  pause: NOOP,
  resume: NOOP,
  toggle: NOOP,
  discard: NOOP,
  save: async () => null,
  request: 'none',
  requestCancel: NOOP,
  requestSave: NOOP,
  dismissRequest: NOOP,
  confirmCancel: NOOP,
  confirmSave: NOOP,
};

const INERT_STREAM: RecordingStream = {
  elapsedMs: 0,
  samples: [],
  sampleCount: 0,
  bufferedCount: 0,
  droppedCount: 0,
  roll: empty.roll.snapshot(),
  trim: empty.trim.snapshot(),
};

const INERT: RecordingContextValue = { ...INERT_CONTROL, ...INERT_STREAM };

const RecordingContext = createContext<RecordingControl>(INERT_CONTROL);
const RecordingStreamContext = createContext<RecordingStream>(INERT_STREAM);

export interface RecordingProviderProps {
  children?: ReactNode;
  /**
   * repassado ao `useRecorder`. Só o teste usa isto, para injetar o repositório
   * em memória — sem isso, montar o shell inteiro abriria o SQLite. As opções do
   * RecordingSession (taxa de decimação, lote, tique) são reais e valem para
   * qualquer tela.
   */
  options?: UseRecorderOptions;
}

export function RecordingProvider({ children, options }: RecordingProviderProps) {
  const recorder = useRecorder(options);
  const [request, setRequest] = useState<RecordingRequest>('none');

  const dismissRequest = useCallback(() => setRequest('none'), []);

  /**
   * `save` devolve `null` quando a escrita falhou. Fechar o diálogo nesse caso
   * perderia a gravação que o usuário acabou de nomear: o modal fica aberto e o
   * erro do gravador aparece, que é onde ele pode ser lido.
   */
  const confirmSave = useCallback(
    async (title: string) => {
      const id = await recorder.save(title);
      if (id !== null) setRequest('none');
    },
    [recorder.save]
  );

  const confirmCancel = useCallback(async () => {
    await recorder.discard();
    setRequest('none');
  }, [recorder.discard]);

  /**
   * As dependências são deliberadamente os **campos**, e não o `recorder`: o
   * `useRecorder` devolve um objeto novo a cada tique de 100 ms, e depender dele
   * tornaria este `useMemo` tão instável quanto a stream — que é justamente o
   * que o contexto separado existe para evitar.
   */
  const { mode, id, error, captureAngle, start, pause, resume, toggle, save, discard } = recorder;

  const control = useMemo<RecordingControl>(
    () => ({
      mode,
      id,
      error,
      captureAngle,
      start,
      pause,
      resume,
      toggle,
      save,
      discard,
      request,
      requestCancel: () => setRequest('cancel'),
      requestSave: () => setRequest('save'),
      dismissRequest,
      confirmCancel,
      confirmSave,
    }),
    [
      mode,
      id,
      error,
      captureAngle,
      start,
      pause,
      resume,
      toggle,
      save,
      discard,
      request,
      dismissRequest,
      confirmCancel,
      confirmSave,
    ]
  );

  const stream = useMemo<RecordingStream>(
    () => ({
      elapsedMs: recorder.elapsedMs,
      samples: recorder.samples,
      sampleCount: recorder.sampleCount,
      bufferedCount: recorder.bufferedCount,
      droppedCount: recorder.droppedCount,
      roll: recorder.roll,
      trim: recorder.trim,
    }),
    [
      recorder.elapsedMs,
      recorder.samples,
      recorder.sampleCount,
      recorder.bufferedCount,
      recorder.droppedCount,
      recorder.roll,
      recorder.trim,
    ]
  );

  return (
    <RecordingStreamContext.Provider value={stream}>
      <RecordingContext.Provider value={control}>{children}</RecordingContext.Provider>
    </RecordingStreamContext.Provider>
  );
}

/**
 * A parte estável. Para a casca — `App`, `NavBar`, `RecordingBar` —, que só
 * precisa do `mode` e não deve re-renderizar a cada tique.
 */
export function useRecordingControl(): RecordingControl {
  const value = useContext(RecordingContext);

  if (value === INERT_CONTROL && __DEV__) {
    console.warn(
      '[recording] useRecordingControl fora do RecordingProvider — a gravação está inerte.'
    );
  }

  return value;
}

/** Controles e stream juntos: é o que a tela, que acompanha a gravação, consome. */
export function useRecording(): RecordingContextValue {
  const control = useContext(RecordingContext);
  const stream = useContext(RecordingStreamContext);

  if (control === INERT_CONTROL && __DEV__) {
    // Não interrompe: um `throw` aqui derrubaria o `HomeScreen.test.tsx`, que
    // monta a tela sem o provider justamente para testar a tela.
    console.warn(
      '[recording] useRecording fora do RecordingProvider — a gravação está inerte.'
    );
  }

  return { ...control, ...stream };
}

export { INERT as INERT_RECORDING_VALUE };
export default RecordingProvider;