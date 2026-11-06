/**
 * Repositório em memória, com a mesma semântica do SQLite.
 *
 * Não é um mock preguiçoso: ele obedece às mesmas regras que o banco de verdade
 * — chave `(recording_id, elapsed_ms)` sem duplicar, cascade ao apagar, ordem
 * por `elapsed_ms`, `recording` ≠ `saved` na listagem. Se esta implementação
 * divergisse do `sqliteReportRepository.ts`, os testes da gravação estariam
 * verdes sobre uma mentira.
 *
 * Existe para dois motivos:
 *
 * 1. O `core/` é testado headless (`DOCUMENTAÇÃO.MD` §5) e `expo-sqlite` é
 *    nativo. A máquina de gravação precisa de um banco nos testes.
 * 2. O schema é enxuto o bastante para caber em um `Map` — a diferença entre o
 *    teste e o aparelho é a persistência, não a lógica.
 */

import type { AngleStatistics, RecordingStatus, Report, ReportSample, RecordingDraft } from '../types';
import type { ReportRepository } from './ReportRepository';

const ZERO: AngleStatistics = { mean: 0, std: 0, min: 0, max: 0 };

/**
 * `Report` é imutável porque é o que a UI lê. O armazenamento interno precisa
 * mutar: cada `updateRecordingStats` reescreve as medidas no lugar, como o
 * `UPDATE` faria no SQLite.
 */
type MutableReport = { -readonly [K in keyof Report]: Report[K] };

function clone(report: Report): Report {
  return { ...report, roll: { ...report.roll }, trim: { ...report.trim } };
}

export interface InMemoryReportRepository extends ReportRepository {
  /** Quantas vezes cada operação foi chamada. Útil para afirmar batching. */
  readonly calls: {
    createRecording: number;
    appendSamples: number;
    updateRecordingStats: number;
    finalizeRecording: number;
    deleteRecording: number;
  };
  /** Total de linhas de `samples` hoje no "banco". */
  sampleRowCount(): number;
  /** Faz a próxima operação.launch falhar, para exercitar o retry do buffer. */
  failNext(operation: keyof InMemoryReportRepository['calls'], error: Error): void;
  clear(): void;
}

export function createInMemoryReportRepository(): InMemoryReportRepository {
  const recordings = new Map<string, MutableReport>();
  const samples = new Map<string, Map<number, ReportSample>>();

  const calls = {
    createRecording: 0,
    appendSamples: 0,
    updateRecordingStats: 0,
    finalizeRecording: 0,
    deleteRecording: 0,
  };

  const failures = new Map<string, Error>();

  function guard(operation: string): void {
    const failure = failures.get(operation);
    if (failure !== undefined) {
      failures.delete(operation);
      throw failure;
    }
  }

  function sorted(recordingId: string): ReportSample[] {
    const rows = samples.get(recordingId);
    if (rows === undefined) {
      return [];
    }
    // Cópia na leitura, como o SQLite faz: lá cada linha é materializada de
    // novo. Devolver o objeto guardado faria o teste passar com um bug que só
    // apareceria no aparelho.
    return [...rows.values()].sort((a, b) => a.elapsedMs - b.elapsedMs).map((row) => ({ ...row }));
  }

  function byStatus(status: RecordingStatus): Report[] {
    return [...recordings.values()]
      .filter((recording) => recording.status === status)
      .sort((a, b) => b.startedAt - a.startedAt)
      .map(clone);
  }

  return {
    calls,

    async createRecording(draft: RecordingDraft): Promise<void> {
      guard('createRecording');
      calls.createRecording += 1;

      if (recordings.has(draft.id)) {
        return;
      }

      recordings.set(draft.id, {
        id: draft.id,
        title: draft.title,
        startedAt: draft.startedAt,
        finishedAt: null,
        durationMs: 0,
        location: draft.location,
        status: 'recording',
        intervalMs: draft.intervalMs,
        sampleCount: 0,
        roll: { ...ZERO },
        trim: { ...ZERO },
      });
    },

    async appendSamples(recordingId: string, incoming: readonly ReportSample[]): Promise<void> {
      guard('appendSamples');
      calls.appendSamples += 1;

      let rows = samples.get(recordingId);
      if (rows === undefined) {
        rows = new Map<number, ReportSample>();
        samples.set(recordingId, rows);
      }

      for (const sample of incoming) {
        // A PK composta: reenviar o mesmo lote sobrescreve a mesma linha.
        rows.set(sample.elapsedMs, { ...sample });
      }
    },

    async updateRecordingStats(
      recordingId: string,
      stats: { sampleCount: number; durationMs: number; roll: AngleStatistics; trim: AngleStatistics }
    ): Promise<void> {
      guard('updateRecordingStats');
      calls.updateRecordingStats += 1;

      const recording = recordings.get(recordingId);
      if (recording === undefined) {
        return;
      }

      recording.sampleCount = stats.sampleCount;
      recording.durationMs = stats.durationMs;
      recording.roll = { ...stats.roll };
      recording.trim = { ...stats.trim };
    },

    async finalizeRecording(recordingId: string, title: string, finishedAt: number): Promise<void> {
      guard('finalizeRecording');
      calls.finalizeRecording += 1;

      const recording = recordings.get(recordingId);
      if (recording === undefined) {
        return;
      }

      recording.status = 'saved';
      recording.title = title;
      recording.finishedAt = finishedAt;
    },

    async deleteRecording(recordingId: string): Promise<void> {
      guard('deleteRecording');
      calls.deleteRecording += 1;

      recordings.delete(recordingId);
      samples.delete(recordingId);
    },

    async listReports(): Promise<Report[]> {
      return byStatus('saved');
    },

    async listSamples(recordingId: string): Promise<ReportSample[]> {
      return sorted(recordingId);
    },

    async findInterrupted(): Promise<Report[]> {
      return byStatus('recording');
    },

    async listByStatus(status: RecordingStatus): Promise<Report[]> {
      return byStatus(status);
    },

    sampleRowCount(): number {
      let total = 0;
      for (const rows of samples.values()) {
        total += rows.size;
      }
      return total;
    },

    failNext(operation: keyof InMemoryReportRepository['calls'], error: Error): void {
      failures.set(operation, error);
    },

    clear(): void {
      recordings.clear();
      samples.clear();
      calls.createRecording = 0;
      calls.appendSamples = 0;
      calls.updateRecordingStats = 0;
      calls.finalizeRecording = 0;
      calls.deleteRecording = 0;
      failures.clear();
    },
  };
}