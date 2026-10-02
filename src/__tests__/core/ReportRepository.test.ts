/**
 * O contrato de persistência, exercitado no repositório em memória.
 *
 * A suíte do SQLite (`sqliteReportRepository.ts`) não roda aqui: `expo-sqlite` é
 * nativo. O que esta suíte trava é a **semântica** que os dois lados têm de
 * cumprir — e o repositório em memória é justamente a implementação que serve de
 * referência a essa semântica. Se ele ficar verde e o SQLite divergir, o app
 * grava coisa diferente do que os testes dizem.
 *
 * O que está travado aqui:
 *
 * - **A linha nasce `recording`** e só vira `saved` no `finalize`. É a US-07: um
 *   app que fecha no meio da prova precisa deixar o que já foi gravado
 *   recuperável, e não órfão.
 * - **`recording` e `saved` são conjuntos separados.** A listagem de relatórios
 *   nunca mostra uma gravação em andamento, e a recuperação nunca mostra um
 *   relatório pronto.
 * - **`(recording_id, elapsed_ms)` não duplica.** Reenviar um lote é o retry do
 *   flush, e um relatório com 40 amostras repetidas é pior do que um relatório
 *   atrasado.
 * - **Apagar a gravação apaga a série** — o `ON DELETE CASCADE` do schema.
 */

import { createInMemoryReportRepository } from '../../core/persistence/inMemoryReportRepository';
import { toReport, toReportSample } from '../../core/persistence/ReportRepository';
import type { RecordingRow } from '../../core/persistence/ReportRepository';
import { SCHEMA_STATEMENTS } from '../../core/persistence/schema';
import type { RecordingDraft, ReportSample } from '../../core/types';

const START = 1_700_000_000_000;

function draft(overrides: Partial<RecordingDraft> = {}): RecordingDraft {
  return {
    id: 'rec-1',
    title: '',
    startedAt: START,
    location: null,
    intervalMs: 100,
    ...overrides,
  };
}

function sample(elapsedMs: number, roll = 1, trim = -1): ReportSample {
  return { elapsedMs, tMs: START + elapsedMs, roll, trim };
}

describe('ReportRepository · criação', () => {
  it('a linha nasce como recording, sem título e sem fim', async () => {
    const repository = createInMemoryReportRepository();
    await repository.createRecording(draft());

    const [interrupted] = await repository.findInterrupted();

    expect(interrupted.status).toBe('recording');
    expect(interrupted.title).toBe('');
    expect(interrupted.finishedAt).toBeNull();
    expect(interrupted.durationMs).toBe(0);
    expect(interrupted.sampleCount).toBe(0);
    expect(interrupted.startedAt).toBe(START);
    expect(interrupted.intervalMs).toBe(100);
  });

  it('guarda a localização quando existe, e null quando não', async () => {
    const repository = createInMemoryReportRepository();
    await repository.createRecording(draft({ id: 'a', location: 'Santos — Porto' }));
    await repository.createRecording(draft({ id: 'b' }));

    const rows = await repository.findInterrupted();

    // `null` é o que faz a tela mostrar "—" em vez de "undefined".
    expect(rows.find((r) => r.id === 'a')?.location).toBe('Santos — Porto');
    expect(rows.find((r) => r.id === 'b')?.location).toBeNull();
  });

  it('repetir o mesmo id não cria uma segunda linha', async () => {
    const repository = createInMemoryReportRepository();

    await repository.createRecording(draft());
    await repository.createRecording(draft({ title: 'segunda tentativa' }));

    const rows = await repository.findInterrupted();
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('');
  });
});

describe('ReportRepository · lista e recuperação', () => {
  it('recording e saved não se misturam', async () => {
    const repository = createInMemoryReportRepository();
    await repository.createRecording(draft({ id: 'andamento' }));
    await repository.createRecording(draft({ id: 'pronto' }));
    await repository.finalizeRecording('pronto', 'Prova', START + 1000);

    expect((await repository.listReports()).map((r) => r.id)).toEqual(['pronto']);
    expect((await repository.findInterrupted()).map((r) => r.id)).toEqual(['andamento']);
  });

  it('a listagem vem da mais recente para a mais antiga', async () => {
    const repository = createInMemoryReportRepository();
    await repository.createRecording(draft({ id: 'antiga', startedAt: START }));
    await repository.createRecording(draft({ id: 'nova', startedAt: START + 60000 }));
    await repository.createRecording(draft({ id: 'meio', startedAt: START + 30000 }));

    await repository.finalizeRecording('antiga', 'A', START);
    await repository.finalizeRecording('nova', 'C', START);
    await repository.finalizeRecording('meio', 'B', START);

    expect((await repository.listReports()).map((r) => r.title)).toEqual(['C', 'B', 'A']);
  });

  it('finalizar preenche título, instante de fim e status', async () => {
    const repository = createInMemoryReportRepository();
    await repository.createRecording(draft());
    await repository.finalizeRecording('rec-1', 'Prova de Inclinação', START + 4200);

    const [report] = await repository.listReports();
    expect(report.title).toBe('Prova de Inclinação');
    expect(report.finishedAt).toBe(START + 4200);
    expect(report.status).toBe('saved');
  });
});

describe('ReportRepository · série temporal', () => {
  it('grava as amostras do lote e as devolve em ordem', async () => {
    const repository = createInMemoryReportRepository();
    await repository.createRecording(draft());
    await repository.appendSamples('rec-1', [sample(300, 3, 1), sample(100, 1, -1), sample(200, 2, 0)]);

    const stored = await repository.listSamples('rec-1');

    expect(stored.map((s) => s.elapsedMs)).toEqual([100, 200, 300]);
    expect(stored.map((s) => s.roll)).toEqual([1, 2, 3]);
    expect(stored[0].tMs).toBe(START + 100);
  });

  it('a mesma amostra reenviada não duplica', async () => {
    const repository = createInMemoryReportRepository();
    await repository.createRecording(draft());

    await repository.appendSamples('rec-1', [sample(100), sample(200)]);
    // Retry de um flush que falhou no meio: o mesmo lote volta.
    await repository.appendSamples('rec-1', [sample(100), sample(200)]);

    expect(await repository.listSamples('rec-1')).toHaveLength(2);
  });

  it('amostras de gravações diferentes não se misturam', async () => {
    const repository = createInMemoryReportRepository();
    await repository.createRecording(draft({ id: 'a' }));
    await repository.createRecording(draft({ id: 'b' }));

    await repository.appendSamples('a', [sample(100, 1, 1)]);
    await repository.appendSamples('b', [sample(100, 9, 9)]);

    expect(await repository.listSamples('a')).toHaveLength(1);
    expect((await repository.listSamples('a'))[0].roll).toBe(1);
    expect((await repository.listSamples('b'))[0].roll).toBe(9);
  });

  it('lote vazio não faz nada', async () => {
    const repository = createInMemoryReportRepository();
    await repository.createRecording(draft());

    await repository.appendSamples('rec-1', []);

    expect(await repository.listSamples('rec-1')).toEqual([]);
  });

  it('lote parcial só grava o que veio', async () => {
    const repository = createInMemoryReportRepository();
    await repository.createRecording(draft());
    await repository.appendSamples('rec-1', [sample(100)]);
    await repository.appendSamples('rec-1', [sample(200)]);

    expect((await repository.listSamples('rec-1')).map((s) => s.elapsedMs)).toEqual([100, 200]);
  });
});

describe('ReportRepository · cabeçalho acumulado', () => {
  it('as medidas podem ser reescritas a cada lote', async () => {
    const repository = createInMemoryReportRepository();
    await repository.createRecording(draft());
    await repository.appendSamples('rec-1', [sample(100, 2), sample(200, 4)]);

    await repository.updateRecordingStats('rec-1', {
      sampleCount: 2,
      durationMs: 200,
      roll: { mean: 3, std: 1, min: 2, max: 4 },
      trim: { mean: 0, std: 0, min: 0, max: 0 },
    });

    const [report] = await repository.findInterrupted();

    expect(report.sampleCount).toBe(2);
    expect(report.durationMs).toBe(200);
    expect(report.roll).toEqual({ mean: 3, std: 1, min: 2, max: 4 });
    expect(report.trim).toEqual({ mean: 0, std: 0, min: 0, max: 0 });
  });

  it('escrever de novo substitui, e não soma', async () => {
    const repository = createInMemoryReportRepository();
    await repository.createRecording(draft());

    for (let i = 1; i <= 4; i += 1) {
      await repository.updateRecordingStats('rec-1', {
        sampleCount: i,
        durationMs: i * 100,
        roll: { mean: i, std: 0, min: i, max: i },
        trim: { mean: 0, std: 0, min: 0, max: 0 },
      });
    }

    const [report] = await repository.findInterrupted();
    expect(report.sampleCount).toBe(4);
    expect(report.durationMs).toBe(400);
    expect(report.roll.mean).toBe(4);
  });

  it('atualizar uma gravação que não existe não cria uma', async () => {
    const repository = createInMemoryReportRepository();

    await repository.updateRecordingStats('fantasma', {
      sampleCount: 5,
      durationMs: 500,
      roll: { mean: 1, std: 0, min: 1, max: 1 },
      trim: { mean: 1, std: 0, min: 1, max: 1 },
    });

    expect(await repository.findInterrupted()).toEqual([]);
  });
});

describe('ReportRepository · apagar', () => {
  it('apagar leva a série junto', async () => {
    const repository = createInMemoryReportRepository();
    await repository.createRecording(draft());
    await repository.appendSamples('rec-1', [sample(100), sample(200)]);

    await repository.deleteRecording('rec-1');

    expect(await repository.listSamples('rec-1')).toEqual([]);
    expect(await repository.findInterrupted()).toEqual([]);
    expect(repository.sampleRowCount()).toBe(0);
  });

  it('apagar uma gravação não toca nas outras', async () => {
    const repository = createInMemoryReportRepository();
    await repository.createRecording(draft({ id: 'a' }));
    await repository.createRecording(draft({ id: 'b' }));
    await repository.appendSamples('a', [sample(100)]);
    await repository.appendSamples('b', [sample(100)]);

    await repository.deleteRecording('a');

    expect(await repository.listSamples('a')).toEqual([]);
    expect(await repository.listSamples('b')).toHaveLength(1);
  });
});

describe('ReportRepository · leitura não entrega referência interna', () => {
  it('mudar o objeto lido não muda o que está guardado', async () => {
    const repository = createInMemoryReportRepository();
    await repository.createRecording(draft());
    await repository.appendSamples('rec-1', [sample(100, 5, 5)]);

    const stored = (await repository.listSamples('rec-1'))[0] as { roll: number };
    stored.roll = 999;

    expect((await repository.listSamples('rec-1'))[0].roll).toBe(5);
  });
});

describe('mapeamento de linha para Report', () => {
  const row: RecordingRow = {
    id: 'rec-1',
    title: 'Prova',
    started_at: START,
    finished_at: START + 5000,
    duration_ms: 5000,
    location: null,
    status: 'saved',
    interval_ms: 100,
    sample_count: 60,
    roll_mean: 3.2,
    roll_std: 0.9,
    roll_min: -1.1,
    roll_max: 8.4,
    trim_mean: -1.1,
    trim_std: 0.7,
    trim_min: -4,
    trim_max: 2,
  };

  it('traduz snake_case para o contrato, com sinal e ordem', () => {
    expect(toReport(row)).toEqual({
      id: 'rec-1',
      title: 'Prova',
      startedAt: START,
      finishedAt: START + 5000,
      durationMs: 5000,
      location: null,
      status: 'saved',
      intervalMs: 100,
      sampleCount: 60,
      roll: { mean: 3.2, std: 0.9, min: -1.1, max: 8.4 },
      trim: { mean: -1.1, std: 0.7, min: -4, max: 2 },
    });
  });

  it('um status desconhecido não vira relatório pronto', () => {
    // Um `status` de coluna seria um bug de migração, não motivo para mostrar
    // uma gravação pela metade na listagem como se estivesse salva.
    expect(toReport({ ...row, status: 'lixo' }).status).toBe('recording');
  });

  it('a linha da série mantém instante e ângulos', () => {
    expect(toReportSample({ elapsed_ms: 250, t_ms: START + 250, roll: -2.5, trim: 1.5 })).toEqual({
      elapsedMs: 250,
      tMs: START + 250,
      roll: -2.5,
      trim: 1.5,
    });
  });
});

describe('schema', () => {
  it('tem uma tabela para o relatório e outra para a série', () => {
    const ddl = SCHEMA_STATEMENTS.join('\n');

    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS recordings');
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS samples');
  });

  it('a PK da série impede repetir o mesmo instante de uma gravação', () => {
    // A chave é o que torna o retry de um flush idempotente.
    expect(SCHEMA_STATEMENTS.join(' ')).toContain('PRIMARY KEY (recording_id, elapsed_ms)');
  });

  it('a série é apagada junto com a gravação', () => {
    expect(SCHEMA_STATEMENTS.join(' ')).toContain('ON DELETE CASCADE');
  });
});