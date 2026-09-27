import { describe, expect, it } from 'vitest';
import type { NeuTableExportMatrix } from './internal/export/neu-table-export-serializer.types';

interface Row {
  readonly id: number;
  readonly name: string;
  readonly amount: number;
  readonly enabled: boolean;
}

function matrix(size: number): NeuTableExportMatrix {
  const rows: readonly Row[] = Array.from({ length: size }, (_, id) => ({
    id,
    name: `Row ${id}`,
    amount: id / 10,
    enabled: id % 2 === 0,
  }));
  return {
    columns: [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Name' },
      { key: 'amount', header: 'Amount' },
      { key: 'enabled', header: 'Enabled' },
    ],
    rows: rows.map((row) => [row.id, row.name, row.amount, row.enabled]),
  };
}

function metric(run: () => number, iterations: number) {
  const samples: number[] = [];
  let outputBytes = 0;
  for (let sample = 0; sample < 25; sample += 1) {
    const started = performance.now();
    for (let index = 0; index < iterations; index += 1) outputBytes = run();
    samples.push((performance.now() - started) / iterations);
  }
  samples.sort((left, right) => left - right);
  return {
    samples: samples.length,
    p50Ms: samples[12]!,
    p95Ms: samples[23]!,
    outputBytes,
  };
}

function heapUsed() {
  const runtime = globalThis as typeof globalThis & {
    readonly process?: { readonly memoryUsage?: () => { readonly heapUsed: number } };
  };
  return runtime.process?.memoryUsage?.().heapUsed ?? 0;
}

describe('NeuTable I export performance evidence', () => {
  it('captures lazy load, CSV/JSON/XLSX serialization and transient allocations', async () => {
    const matrix1k = matrix(1_000);
    const matrix10k = matrix(10_000);
    let loadStarted = performance.now();
    const { serializeNeuTableCsv } = await import(
      './internal/features/export/neu-table-csv-export'
    );
    const csvLoadMs = performance.now() - loadStarted;
    loadStarted = performance.now();
    const { serializeNeuTableJson } = await import(
      './internal/features/export/neu-table-json-export'
    );
    const jsonLoadMs = performance.now() - loadStarted;
    loadStarted = performance.now();
    const { serializeNeuTableXlsx } = await import(
      './internal/features/export/neu-table-xlsx-export'
    );
    const xlsxLoadMs = performance.now() - loadStarted;
    const beforeHeap = heapUsed();
    const metrics = {
      csvLoadMs,
      jsonLoadMs,
      xlsxLoadMs,
      csv1k: metric(() => serializeNeuTableCsv(matrix1k).bytes.byteLength, 20),
      csv10k: metric(() => serializeNeuTableCsv(matrix10k).bytes.byteLength, 4),
      json1k: metric(() => serializeNeuTableJson(matrix1k).bytes.byteLength, 20),
      json10k: metric(() => serializeNeuTableJson(matrix10k).bytes.byteLength, 4),
      xlsx1k: metric(() => serializeNeuTableXlsx(matrix1k).bytes.byteLength, 4),
      heapDeltaBytes: heapUsed() - beforeHeap,
      matrixCells1k: matrix1k.rows.length * matrix1k.columns.length,
      matrixCells10k: matrix10k.rows.length * matrix10k.columns.length,
    };

    expect(metrics.csv10k.outputBytes).toBeGreaterThan(metrics.csv1k.outputBytes);
    expect(metrics.json10k.outputBytes).toBeGreaterThan(metrics.json1k.outputBytes);
    expect(metrics.xlsx1k.outputBytes).toBeGreaterThan(0);
    const runtime = globalThis as typeof globalThis & {
      readonly process?: { readonly stdout?: { write(value: string): void } };
    };
    runtime.process?.stdout?.write(
      `N2_TABLE_I_PERFORMANCE:${JSON.stringify(metrics)}\n`,
    );
  }, 15_000);
});
