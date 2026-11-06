export interface Vector3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface MotionSample {
  // Convenção expo-sensors/W3C: deitado (tela para cima) accelerationIncludingGravity ≈ (0, 0, -9.81)
  readonly accelerationIncludingGravity: Vector3;
  readonly rotationRate: Vector3;
  readonly rotation: Vector3;
  readonly timestamp: number;
}

export interface Angles {
  readonly roll: number;
  readonly trim: number;
}

export interface Calibration {
  readonly roll: number;
  readonly trim: number;
}

// ---------------------------------------------------------------------------
// Gravação e relatório
// ---------------------------------------------------------------------------

/** Estado do botão/gravador. Uma sessão nunca está em dois modos ao mesmo tempo. */
export type RecordingMode = 'idle' | 'recording' | 'paused';

/**
 * Estado do registro no banco.
 *
 * A linha nasce `recording` e só vira `saved` quando o usuário confirma. É o que
 * faz a US-07: se o app fechar ou o celular desligar no meio da prova, o que já
 * foi gravado continua no banco, recuperável.
 */
export type RecordingStatus = 'recording' | 'saved';

/** Uma linha da série temporal: a pose em um instante, com o tempo desde o início. */
export interface ReportSample {
  /** Milissegundos desde o início da gravação. É o eixo x do gráfico. */
  readonly elapsedMs: number;
  /** Epoch em ms do instante da leitura. Ordenável e alinhado com a data do relatório. */
  readonly tMs: number;
  readonly roll: number;
  readonly trim: number;
}

/** Medidas de um conjunto de ângulos, calculadas incrementalmente durante a gravação. */
export interface AngleStatistics {
  readonly mean: number;
  /** Desvio padrão populacional (divisor N, não N−1). */
  readonly std: number;
  readonly min: number;
  readonly max: number;
}

/** O cabeçalho do relatório: o que a listagem mostra e o que o detalhe usa. */
export interface Report {
  readonly id: string;
  readonly title: string;
  readonly startedAt: number;
  readonly finishedAt: number | null;
  readonly durationMs: number;
  /** Texto livre de localização; `null` quando o GPS está desligado. */
  readonly location: string | null;
  readonly status: RecordingStatus;
  /** Intervalo nominal entre amostras, em ms. 100 = 12 Hz arredondado. */
  readonly intervalMs: number;
  readonly sampleCount: number;
  readonly roll: AngleStatistics;
  readonly trim: AngleStatistics;
}

/**
 * O cabeçalho mais recente de uma gravação, no formato que o `createRecording`
 * e o `updateRecordingStats` recebem.
 *
 * Separado de `Report` porque `Report` é o que sai da leitura — já vem com
 * número filled in e é imutável para a UI.
 */
export interface RecordingDraft {
  readonly id: string;
  readonly title: string;
  readonly startedAt: number;
  readonly location: string | null;
  readonly intervalMs: number;
}
