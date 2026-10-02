/**
 * O banco da gravação: duas tabelas e nada mais.
 *
 * A divisão é a mesma que a do relatório — `recordings` é o que a listagem lê
 * sem tocar na série, `samples` é a série temporal. Separá-las é o que permite
 * que "abrir a lista de relatórios" não leia 40 mil linhas, e o que permite
 * apagar uma gravação inteira com um `DELETE`.
 *
 * ## Por que a linha do relatório nasce no início
 *
 * A US-07 pede que os dados fiquem salvos se o app fechar
 * (`README.md`). Se o cabeçalho só fosse escrito no `save()`, uma queda de
 * energia no meio da prova levaria as amostras junto — porque elas pertenceriam
 * a uma linha que nunca existiu. Por isso `start` insere a linha já, e o
 * `status` diz se ela é uma gravação em andamento (`recording`) ou um relatório
 * pronto (`saved`).
 *
 * ## `samples` sem rowid
 *
 * A PK é `(recording_id, elapsed_ms)`, e `elapsed_ms` é único dentro da gravação.
 * `WITHOUT ROWID` guarda as linhas já ordenadas pela chave, então ler a série em
 * ordem não custa um sort, e reescrever o mesmo lote (um retry de flush) colide
 * com a linha existente em vez de duplicar a leitura.
 */

/**
 * Colunas que guardam medidas. Estão repetidas em `recordings` para roll e trim
 * porque o relatório as mostra como números na listagem, e calculá-las na
 * leitura exigiria varrer a série inteira.
 */
export const SCHEMA_VERSION = 1;

export const SCHEMA_STATEMENTS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS recordings (
     id           TEXT    PRIMARY KEY NOT NULL,
     title        TEXT    NOT NULL DEFAULT '',
     started_at   INTEGER NOT NULL,
     finished_at  INTEGER,
     duration_ms  INTEGER NOT NULL DEFAULT 0,
     location     TEXT,
     status       TEXT    NOT NULL,
     interval_ms  INTEGER NOT NULL,
     sample_count INTEGER NOT NULL DEFAULT 0,
     roll_mean REAL NOT NULL DEFAULT 0,
     roll_std  REAL NOT NULL DEFAULT 0,
     roll_min  REAL NOT NULL DEFAULT 0,
     roll_max  REAL NOT NULL DEFAULT 0,
     trim_mean REAL NOT NULL DEFAULT 0,
     trim_std  REAL NOT NULL DEFAULT 0,
     trim_min  REAL NOT NULL DEFAULT 0,
     trim_max  REAL NOT NULL DEFAULT 0
   )`,

  // A listagem filtra por data e ordena por data; o índice evita varrer a tabela.
  `CREATE INDEX IF NOT EXISTS idx_recordings_started_at ON recordings (started_at DESC)`,

  `CREATE TABLE IF NOT EXISTS samples (
     recording_id TEXT    NOT NULL REFERENCES recordings (id) ON DELETE CASCADE,
     elapsed_ms   INTEGER NOT NULL,
     t_ms         INTEGER NOT NULL,
     roll         REAL    NOT NULL,
     trim         REAL    NOT NULL,
     PRIMARY KEY (recording_id, elapsed_ms)
   ) WITHOUT ROWID`,
];

/**
 * PRAGMAs aplicados logo após abrir a conexão.
 *
 * - `foreign_keys` é **por conexão**, não por banco: sem ele o
 *   `ON DELETE CASCADE` de `samples` não acontece e apagar uma gravação deixaria
 *   a série órfã no arquivo.
 * - `journal_mode = WAL` faz a escrita não bloquear leitura. O flush de 2 s
 *   segura uma transação de escrita; sem WAL a listagem de relatórios ficaria
 *   esperando.
 */
export const CONNECTION_PRAGMAS: readonly string[] = [
  'PRAGMA journal_mode = WAL',
  'PRAGMA foreign_keys = ON',
];