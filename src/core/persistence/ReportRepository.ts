/**
 * O contrato de persistência dos relatórios.
 *
 * A interface existe por um motivo concreto: `expo-sqlite` é um módulo nativo e
 * não roda no Jest, e o `core/` só é testável headless justamente por não
 * depender de nada nativo além do `SensorService` (`DOCUMENTAÇÃO.MD` §5). Com a
 * interface, a máquina de gravação é testada contra `createInMemoryReportRepository`
 * e a implementação real (`sqliteReportRepository.ts`) é a única coisa que
 * precisa de um aparelho.
 *
 * A forma segue a do resto do `core/`: **funções puras e factories**, nunca
 * classes, para que o repositório seja mockável sem `jest.mock` de módulo.
 *
 * ## Granularidade
 *
 * `appendSamples` recebe o lote inteiro de uma vez e o grava em uma transação.
 * Isso é deliberado: 24 linhas de 2 em 2 s, cada uma em sua própria transação,
 * pagaria o custo de commit por amostra e daria 24 chances de o celular
 * morrer no meio de uma prova de mar.
 */

import type { AngleStatistics, RecordingStatus, Report, ReportSample, RecordingDraft } from '../types';

export interface ReportRepository {
  /** Cria a linha do relatório no início da gravação. Idempotente por `id`. */
  createRecording(draft: RecordingDraft): Promise<void>;

  /**
   * Grava um lote da série temporal. Uma transação só.
   *
   * Deve aceitar reenvio do mesmo lote sem duplicar: a chave
   * `(recording_id, elapsed_ms)` torna o insert repetido um no-op.
   */
  appendSamples(recordingId: string, samples: readonly ReportSample[]): Promise<void>;

  /**
   * Atualiza o cabeçalho com o total acumulado e as medidas.
   *
   * Vai para o mesmo lugar a cada flush, não só no fim: é isso que faz uma
   * gravação interrompida ter medidas coerentes com as amostras já gravadas.
   */
  updateRecordingStats(
    recordingId: string,
    stats: { sampleCount: number; durationMs: number; roll: AngleStatistics; trim: AngleStatistics }
  ): Promise<void>;

  /** Fecha a gravação: título, `finished_at`, duração final e `status = 'saved'`. */
  finalizeRecording(recordingId: string, title: string, finishedAt: number): Promise<void>;

  /** Apaga a gravação e a série dela. É o que faz o "Cancelar gravação". */
  deleteRecording(recordingId: string): Promise<void>;

  /** Todos os relatórios prontos, mais recentes primeiro. */
  listReports(): Promise<Report[]>;

  /** A série temporal de um relatório, em ordem de `elapsed_ms`. */
  listSamples(recordingId: string): Promise<ReportSample[]>;

  /**
   * Gravações que ficaram em `recording` — o app fechou, o celular desligou ou
   * o processo morreu no meio. Recuperáveis, porque cada batch já está no disco.
   */
  findInterrupted(): Promise<Report[]>;

  /** Gravações com `status` igual ao dado. Usado pela listagem e pela recuperação. */
  listByStatus(status: RecordingStatus): Promise<Report[]>;
}

/** A linha crua do banco, antes de virar `Report`. Existe para o mapeamento ser testável. */
export interface RecordingRow {
  id: string;
  title: string;
  started_at: number;
  finished_at: number | null;
  duration_ms: number;
  location: string | null;
  status: string;
  interval_ms: number;
  sample_count: number;
  roll_mean: number;
  roll_std: number;
  roll_min: number;
  roll_max: number;
  trim_mean: number;
  trim_std: number;
  trim_min: number;
  trim_max: number;
}

export interface SampleRow {
  elapsed_ms: number;
  t_ms: number;
  roll: number;
  trim: number;
}

/** Onde uma gravação está no ciclo de vida — o subsetting de `findInterrupted`. */
export function toReport(row: RecordingRow): Report {
  return {
    id: row.id,
    title: row.title,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    durationMs: row.duration_ms,
    location: row.location,
    status: row.status === 'saved' ? 'saved' : 'recording',
    intervalMs: row.interval_ms,
    sampleCount: row.sample_count,
    roll: { mean: row.roll_mean, std: row.roll_std, min: row.roll_min, max: row.roll_max },
    trim: { mean: row.trim_mean, std: row.trim_std, min: row.trim_min, max: row.trim_max },
  };
}

export function toReportSample(row: SampleRow): ReportSample {
  return { elapsedMs: row.elapsed_ms, tMs: row.t_ms, roll: row.roll, trim: row.trim };
}