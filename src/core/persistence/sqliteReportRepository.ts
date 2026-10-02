/**
 * O `ReportRepository` sobre `expo-sqlite`.
 *
 * Três decisões aqui e o resto é SQL:
 *
 * 1. **Prepared statement para o insert da série.** A cada flush são ~24 linhas
 *    com a mesma forma. `prepareAsync` faz o SQLite parsear o SQL uma vez e o
 *    `executeAsync` só ligar valores; num `runAsync` em loop o texto é
 *    reanalisado 24 vezes por flush, 1.440 vezes numa prova de uma hora.
 *
 * 2. **`withExclusiveTransactionAsync` no lote inteiro.** As 24 amostras e o
 *    `UPDATE` do cabeçalho entram juntos ou não entram: um cabeçalho que conta
 *    500 amostras com 480 linhas no disco é pior do que não ter cabeçalho.
 *
 * 3. **`INSERT OR REPLACE` na série.** A PK `(recording_id, elapsed_ms)` já
 *    torna o reenvio de um lote idempotente; o `OR REPLACE` transforma isso em
 *    "atualiza" explícito em vez de confiar num `ON CONFLICT` implícito — o
 *    retry de um flush que falhou no meio não duplica nada.
 *
 * O statement preparado é criado uma vez, na fábrica, e finalizado junto com o
 * repositório.
 */

import type * as SQLite from 'expo-sqlite';

import type { AngleStatistics, RecordingStatus, Report, ReportSample, RecordingDraft } from '../types';
import type { ReportRepository, RecordingRow, SampleRow } from './ReportRepository';
import { toReport, toReportSample } from './ReportRepository';

const COLUMNS = `
  id, title, started_at, finished_at, duration_ms, location, status,
  interval_ms, sample_count,
  roll_mean, roll_std, roll_min, roll_max,
  trim_mean, trim_std, trim_min, trim_max
`;

const INSERT_RECORDING = `
  INSERT INTO recordings (
    id, title, started_at, finished_at, duration_ms, location, status, interval_ms, sample_count,
    roll_mean, roll_std, roll_min, roll_max, trim_mean, trim_std, trim_min, trim_max
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0)
  ON CONFLICT (id) DO NOTHING
`;

const INSERT_SAMPLE = `
  INSERT OR REPLACE INTO samples (recording_id, elapsed_ms, t_ms, roll, trim)
  VALUES (?, ?, ?, ?, ?)
`;

const UPDATE_STATS = `
  UPDATE recordings
     SET sample_count = ?, duration_ms = ?,
         roll_mean = ?, roll_std = ?, roll_min = ?, roll_max = ?,
         trim_mean = ?, trim_std = ?, trim_min = ?, trim_max = ?
   WHERE id = ?
`;

const FINALIZE = `UPDATE recordings SET status = 'saved', title = ?, finished_at = ? WHERE id = ?`;

const DELETE = `DELETE FROM recordings WHERE id = ?`;

const LIST_BY_STATUS = `SELECT ${COLUMNS} FROM recordings WHERE status = ? ORDER BY started_at DESC`;

const LIST_SAMPLES = `SELECT elapsed_ms, t_ms, roll, trim FROM samples WHERE recording_id = ? ORDER BY elapsed_ms`;

export interface SQLiteReportRepository extends ReportRepository {
  /** Fecha o statement preparado. Não fecha a conexão — quem abre, fecha. */
  close(): Promise<void>;
}

export function createSQLiteReportRepository(db: SQLite.SQLiteDatabase): SQLiteReportRepository {
  // Criado na fábrica e nunca reaproveitado entre gravações: a chave da PK já
  // carrega o `recording_id`, então um statement serve para todas.
  let insertSample: Promise<SQLite.SQLiteStatement> | null = db.prepareAsync(INSERT_SAMPLE);

  function resetStatement(): Promise<SQLite.SQLiteStatement> {
    // Uma falha de I/O invalida o statement. Recriá-lo custa um parse e faz a
    // gravação seguir em vez de falhar até o fim da prova.
    insertSample = db.prepareAsync(INSERT_SAMPLE);
    return insertSample;
  }

  function statement(): Promise<SQLite.SQLiteStatement> {
    return insertSample ?? resetStatement();
  }

  return {
    async createRecording(draft: RecordingDraft): Promise<void> {
      await db.runAsync(INSERT_RECORDING, [
        draft.id,
        draft.title,
        draft.startedAt,
        null,
        0,
        draft.location,
        'recording',
        draft.intervalMs,
        0,
      ]);
    },

    async appendSamples(recordingId: string, samples: readonly ReportSample[]): Promise<void> {
      if (samples.length === 0) {
        return;
      }

      const insert = await statement();

      await db.withExclusiveTransactionAsync(async (txn) => {
        for (const sample of samples) {
          await insert.executeAsync([recordingId, sample.elapsedMs, sample.tMs, sample.roll, sample.trim]);
        }
      });
    },

    async updateRecordingStats(
      recordingId: string,
      stats: { sampleCount: number; durationMs: number; roll: AngleStatistics; trim: AngleStatistics }
    ): Promise<void> {
      await db.runAsync(UPDATE_STATS, [
        stats.sampleCount,
        stats.durationMs,
        stats.roll.mean,
        stats.roll.std,
        stats.roll.min,
        stats.roll.max,
        stats.trim.mean,
        stats.trim.std,
        stats.trim.min,
        stats.trim.max,
        recordingId,
      ]);
    },

    async finalizeRecording(recordingId: string, title: string, finishedAt: number): Promise<void> {
      await db.runAsync(FINALIZE, [title, finishedAt, recordingId]);
    },

    async deleteRecording(recordingId: string): Promise<void> {
      // O cascade de `samples` depende de `PRAGMA foreign_keys = ON`, que é
      // aplicado por conexão no `RecordingStore`.
      await db.runAsync(DELETE, [recordingId]);
    },

    async listReports(): Promise<Report[]> {
      const rows = await db.getAllAsync<RecordingRow>(LIST_BY_STATUS, ['saved']);
      return rows.map(toReport);
    },

    async listSamples(recordingId: string): Promise<ReportSample[]> {
      const rows = await db.getAllAsync<SampleRow>(LIST_SAMPLES, [recordingId]);
      return rows.map(toReportSample);
    },

    async findInterrupted(): Promise<Report[]> {
      const rows = await db.getAllAsync<RecordingRow>(LIST_BY_STATUS, ['recording']);
      return rows.map(toReport);
    },

    async listByStatus(status: RecordingStatus): Promise<Report[]> {
      const rows = await db.getAllAsync<RecordingRow>(LIST_BY_STATUS, [status]);
      return rows.map(toReport);
    },

    async close(): Promise<void> {
      const current = insertSample;
      insertSample = null;
      if (current !== null) {
        await (await current).finalizeAsync();
      }
    },
  };
}