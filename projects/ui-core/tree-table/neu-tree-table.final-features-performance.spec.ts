import { describe, expect, it } from 'vitest';
import {
  buildNeuTreeTableEditCommit,
  createNeuTreeTableEditSession,
  updateNeuTreeTableEditDraft,
} from './internal/editing/neu-tree-table-editing';
import { buildNeuTreeTableExportMatrix } from './internal/export/neu-tree-table-export';
import { serializeNeuTreeTableCsv } from './internal/features/export/neu-tree-table-csv-export';
import { serializeNeuTreeTableJson } from './internal/features/export/neu-tree-table-json-export';
import { serializeNeuTreeTableXlsx } from './internal/features/export/neu-tree-table-xlsx-export';
import {
  normalizeNeuTreeTableHierarchy,
  projectNormalizedNeuTreeTableHierarchy,
} from './internal/hierarchy/neu-tree-table-hierarchy';
import type { NeuTreeTableColumn, NeuTreeTableHierarchy } from './public/neu-tree-table.types';

interface Row {
  readonly id: number;
  readonly name: string;
  readonly amount: number;
}

const columns: readonly NeuTreeTableColumn<Row, 'name' | 'amount'>[] = [
  {
    id: 'name',
    header: 'Name',
    field: 'name',
    value: (row) => row.name,
    edit: { field: 'name', read: (row) => row.name, write: (row, value) => ({ ...row, name: String(value) }) },
  },
  { id: 'amount', header: 'Amount', field: 'amount', value: (row) => row.amount },
];

function wide(size: number) {
  const rows = Array.from({ length: size }, (_, id): Row => ({ id, name: `Node ${id}`, amount: id }));
  const hierarchy: NeuTreeTableHierarchy<number> = {
    hierarchyRevision: 1,
    queryRevision: 1,
    roots: {
      status: 'loaded',
      keys: rows.map((row) => row.id),
      relationRevision: 1,
      appliedRequestId: null,
      total: size,
      completeness: 'complete',
    },
    children: [],
  };
  const normalized = normalizeNeuTreeTableHierarchy(rows, (row) => row.id, hierarchy);
  const projection = projectNormalizedNeuTreeTableHierarchy(normalized, []);
  return { rows, normalized, projection };
}

function sample(run: () => void, count = 20): { readonly p50Ms: number; readonly p95Ms: number } {
  const values: number[] = [];
  for (let index = 0; index < count; index += 1) {
    const start = performance.now();
    run();
    values.push(performance.now() - start);
  }
  values.sort((left, right) => left - right);
  return {
    p50Ms: values[Math.floor(values.length * 0.5)] ?? 0,
    p95Ms: values[Math.floor(values.length * 0.95)] ?? 0,
  };
}

describe('N2-015H performance', () => {
  it('captures editing and export projection/serialization baselines', () => {
    const one = wide(1_000);
    const ten = wide(10_000);
    const snapshot = (source: ReturnType<typeof wide>, format: 'csv' | 'json' | 'xlsx') => ({
      browser: true,
      active: () => true,
      mode: 'client' as const,
      request: {
        format,
        scope: 'loaded' as const,
        query: { page: 0, pageSize: 25, search: '', sort: [], filters: null },
      },
      options: { formats: ['csv', 'json', 'xlsx'] as const, defaultFilename: 'tree-table' },
      columns,
      projection: source.projection,
      normalized: source.normalized,
      selection: { kind: 'keys' as const, keys: [] },
    });
    const matrix1k = buildNeuTreeTableExportMatrix(snapshot(one, 'csv')).matrix;
    const matrix10k = buildNeuTreeTableExportMatrix(snapshot(ten, 'csv')).matrix;
    const row = one.rows[0]!;
    const metrics = {
      edit100: sample(() => {
        for (let index = 0; index < 100; index += 1) {
          const session = createNeuTreeTableEditSession(
            { kind: 'cell', key: row.id, columnId: 'name' },
            row,
            columns,
          )!;
          buildNeuTreeTableEditCommit(updateNeuTreeTableEditDraft(session, 'name', `Draft ${index}`), columns);
        }
      }),
      project1k: sample(() => void buildNeuTreeTableExportMatrix(snapshot(one, 'csv'))),
      project10k: sample(() => void buildNeuTreeTableExportMatrix(snapshot(ten, 'csv')), 10),
      csv1k: sample(() => void serializeNeuTreeTableCsv(matrix1k), 10),
      csv10k: sample(() => void serializeNeuTreeTableCsv(matrix10k), 5),
      json1k: sample(() => void serializeNeuTreeTableJson(matrix1k), 10),
      json10k: sample(() => void serializeNeuTreeTableJson(matrix10k), 5),
      xlsx1k: sample(() => void serializeNeuTreeTableXlsx(matrix1k), 10),
      xlsx10k: sample(() => void serializeNeuTreeTableXlsx(matrix10k), 5),
      lifecycle100: sample(() => {
        for (let index = 0; index < 100; index += 1) {
          void createNeuTreeTableEditSession(
            { kind: 'cell', key: row.id, columnId: 'name' },
            row,
            columns,
          );
        }
      }),
      outputBytes: {
        csv1k: serializeNeuTreeTableCsv(matrix1k).bytes.byteLength,
        csv10k: serializeNeuTreeTableCsv(matrix10k).bytes.byteLength,
        json1k: serializeNeuTreeTableJson(matrix1k).bytes.byteLength,
        json10k: serializeNeuTreeTableJson(matrix10k).bytes.byteLength,
        xlsx1k: serializeNeuTreeTableXlsx(matrix1k).bytes.byteLength,
        xlsx10k: serializeNeuTreeTableXlsx(matrix10k).bytes.byteLength,
      },
    };
    expect(matrix10k.rows).toHaveLength(10_000);
    console.log(`N2_TREE_TABLE_H_PERFORMANCE:${JSON.stringify(metrics)}`);
  }, 30_000);
});
