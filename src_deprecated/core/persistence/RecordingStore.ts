/**
 * A conexão com o arquivo do banco.
 *
 * `expo-sqlite` entrega uma API de callback por operação; abrir a conexão a
 * cada chamada pagaria o custo de I/O a cada amostra. O store abre **uma vez**,
 * aplica os PRAGMAs e guarda a promessa — e expõe a mesma coisa para todo mundo,
 * inclusive a segunda chamada, que recebe a mesma promessa em vez de abrir um
 * segundo handle.
 *
 * Fica num módulo só (e não dentro do repositório) porque tem dois consumidores
 * com ciclos de vida diferentes: o repositório, que vive enquanto o app vive, e
 * a tela de relatórios, que pode querer ler a lista antes do app ter gravado
 * qualquer coisa.
 *
 * Sobre native: isto aqui **não** roda no Jest. É o único arquivo da
 * persistência que importa `expo-sqlite`, e nenhum teste o toca — o
 * `sqliteReportRepository.ts` recebe a `SQLiteDatabase` por injeção, então é
 * testável com um substituto.
 */

import * as SQLite from 'expo-sqlite';

import type { ReportRepository } from './ReportRepository';
import { CONNECTION_PRAGMAS, SCHEMA_STATEMENTS } from './schema';
import { createSQLiteReportRepository } from './sqliteReportRepository';

const DATABASE_NAME = 'inclination.db';

let pending: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Abre (ou devolve) a conexão, já com o schema criado.
 *
 * Idempotente e concorrente: duas chamadas antes da resolução compartilham a
 * mesma promessa, então o app não abre dois handles do mesmo arquivo.
 */
export function openRecordingDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (pending === null) {
    pending = open();
  }
  return pending;
}

/**
 * Esquece a conexão atual. Usado pelo "apagar tudo" dos ajustes e pelos testes
 * de integração; em operação normal quem chama é o próprio app saindo de cena.
 */
export function closeRecordingDatabase(): Promise<void> {
  const current = pending;
  pending = null;
  return current === null ? Promise.resolve() : current.then((db) => db.closeAsync());
}

async function open(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

  for (const pragma of CONNECTION_PRAGMAS) {
    await db.execAsync(pragma);
  }

  for (const statement of SCHEMA_STATEMENTS) {
    await db.execAsync(statement);
  }

  return db;
}

/** O repositório real, já apontando para o arquivo do app. */
export async function createReportRepository(): Promise<ReportRepository> {
  return createSQLiteReportRepository(await openRecordingDatabase());
}