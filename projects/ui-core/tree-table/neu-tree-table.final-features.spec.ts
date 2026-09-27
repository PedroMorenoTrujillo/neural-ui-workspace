import { describe, expect, it } from 'vitest';
import {
  buildNeuTreeTableEditCommit,
  createNeuTreeTableEditSession,
  updateNeuTreeTableEditDraft,
  validateNeuTreeTableEdit,
} from './internal/editing/neu-tree-table-editing';
import {
  buildNeuTreeTableExportMatrix,
  executeNeuTreeTableExport,
} from './internal/export/neu-tree-table-export';
import { serializeNeuTreeTableCsv } from './internal/features/export/neu-tree-table-csv-export';
import { serializeNeuTreeTableJson } from './internal/features/export/neu-tree-table-json-export';
import { serializeNeuTreeTableXlsx } from './internal/features/export/neu-tree-table-xlsx-export';
import {
  normalizeNeuTreeTableHierarchy,
  projectNormalizedNeuTreeTableHierarchy,
} from './internal/hierarchy/neu-tree-table-hierarchy';
import type {
  NeuTreeTableColumn,
  NeuTreeTableHierarchy,
} from './public/neu-tree-table.types';

interface Row {
  readonly id: number;
  readonly name: string;
  readonly amount: number;
}

type Field = 'name' | 'amount';

const columns: readonly NeuTreeTableColumn<Row, Field>[] = [
  {
    id: 'name',
    header: 'Name',
    field: 'name',
    value: (row) => row.name,
    edit: { field: 'name', read: (row) => row.name, write: (row, value) => ({ ...row, name: String(value) }) },
  },
  { id: 'amount', header: 'Amount', field: 'amount', value: (row) => row.amount },
];

const rows: readonly Row[] = [
  { id: 1, name: '=Root', amount: 10 },
  { id: 2, name: 'Child', amount: 20 },
  { id: 3, name: 'Grandchild', amount: 30 },
];

const hierarchy: NeuTreeTableHierarchy<number> = {
  hierarchyRevision: 1,
  queryRevision: 1,
  roots: {
    status: 'loaded',
    keys: [1],
    relationRevision: 1,
    appliedRequestId: null,
    total: 1,
    completeness: 'complete',
  },
  children: [
    {
      parentKey: 1,
      relation: {
        status: 'loaded',
        keys: [2],
        relationRevision: 1,
        appliedRequestId: null,
        total: 1,
        completeness: 'complete',
      },
    },
    {
      parentKey: 2,
      relation: {
        status: 'loaded',
        keys: [3],
        relationRevision: 1,
        appliedRequestId: null,
        total: 1,
        completeness: 'complete',
      },
    },
  ],
};

describe('NeuTreeTable 2 final P1 features', () => {
  it('keeps edit drafts private and builds an immutable consumer replacement', () => {
    const state = { kind: 'cell', key: 1, columnId: 'name' } as const;
    const session = createNeuTreeTableEditSession(state, rows[0]!, columns);
    expect(session).not.toBeNull();
    const updated = updateNeuTreeTableEditDraft(session!, 'name', 'Renamed');
    const validation = validateNeuTreeTableEdit(updated, { mode: 'cell', validate: () => true }, 'name');
    const commit = buildNeuTreeTableEditCommit(validation.session, columns);
    expect(commit).toMatchObject({ key: 1, field: 'name', source: 'cell' });
    expect(commit.value).toEqual({ id: 1, name: 'Renamed', amount: 10 });
    expect(rows[0]!.name).toBe('=Root');
    expect(commit.draft).toEqual({ name: 'Renamed' });
  });

  it('keeps a rejected draft active with its validation message', () => {
    const session = createNeuTreeTableEditSession(
      { kind: 'cell', key: 1, columnId: 'name' },
      rows[0]!,
      columns,
    )!;
    const result = validateNeuTreeTableEdit(
      updateNeuTreeTableEditDraft(session, 'name', ''),
      { mode: 'cell', validate: () => 'Name is required' },
      'name',
    );
    expect(result.valid).toBe(false);
    expect(result.session.validationError).toBe('Name is required');
  });

  it('projects visible, loaded and selected scopes without synthetic hierarchy rows', () => {
    const normalized = normalizeNeuTreeTableHierarchy(rows, (row) => row.id, hierarchy);
    const projection = projectNormalizedNeuTreeTableHierarchy(normalized, [1]);
    const base = {
      browser: true,
      active: () => true,
      mode: 'client' as const,
      options: { formats: ['csv', 'json', 'xlsx'] as const, defaultFilename: 'tree-table' },
      columns,
      projection,
      normalized,
      selection: { kind: 'keys', keys: [3, 1] } as const,
    };
    const request = {
      format: 'json' as const,
      filename: 'tree.json',
      query: { page: 0, pageSize: 25, search: '', sort: [], filters: null },
    };
    expect(buildNeuTreeTableExportMatrix({ ...base, request: { ...request, scope: 'visible' } }).matrix.rows)
      .toHaveLength(2);
    expect(buildNeuTreeTableExportMatrix({ ...base, request: { ...request, scope: 'loaded' } }).matrix.rows)
      .toEqual([['=Root', 10], ['Child', 20], ['Grandchild', 30]]);
    expect(buildNeuTreeTableExportMatrix({ ...base, request: { ...request, scope: 'selected' } }).matrix.rows)
      .toEqual([['Grandchild', 30], ['=Root', 10]]);
  });

  it('delegates an unknown remote selected key without enumerating the backend', () => {
    const normalized = normalizeNeuTreeTableHierarchy(rows, (row) => row.id, hierarchy);
    const projection = projectNormalizedNeuTreeTableHierarchy(normalized, []);
    const result = buildNeuTreeTableExportMatrix({
      browser: true,
      active: () => true,
      mode: 'remote',
      request: {
        format: 'csv',
        scope: 'selected',
        query: { page: 0, pageSize: 25, search: '', sort: [], filters: null },
      },
      options: { formats: ['csv'], defaultFilename: 'tree-table' },
      columns,
      projection,
      normalized,
      selection: { kind: 'keys', keys: [1_000_000] },
    });
    expect(result.delegated).toBe(true);
    expect(result.matrix.rows).toEqual([]);
  });

  it('serializes deterministic CSV/JSON/XLSX and blocks implicit formulas', async () => {
    const matrix = {
      columns: [{ key: 'name', header: 'Name' }],
      rows: [['=2+2'], ['quote " and\nnewline'], [null]],
    } as const;
    const csv = new TextDecoder().decode(serializeNeuTreeTableCsv(matrix).bytes);
    const json = new TextDecoder().decode(serializeNeuTreeTableJson(matrix).bytes);
    const xlsx = new TextDecoder().decode(serializeNeuTreeTableXlsx(matrix).bytes);
    expect(csv).toContain("\"'=2+2\"");
    expect(csv).toContain('quote "" and\nnewline');
    expect(JSON.parse(json)).toEqual([
      { name: '=2+2' },
      { name: 'quote " and\nnewline' },
      { name: null },
    ]);
    expect(xlsx).toContain('t="inlineStr"');
    expect(xlsx).not.toContain('<f>');
  });

  it('normalizes unusual JSON values and rejects circular export data', () => {
    const repeated = { z: 1, a: undefined };
    const matrix = {
      columns: [
        { key: 'numbers', header: 'Numbers' },
        { key: 'nested', header: 'Nested' },
        { key: 'other', header: 'Other' },
      ],
      rows: [[
        [Number.NaN, Number.POSITIVE_INFINITY, 3n, undefined],
        { z: repeated, a: repeated, when: new Date('2024-01-02T03:04:05.000Z') },
        [new Set([1]), Symbol('label'), () => 'callable'],
      ]],
    } as const;

    const serialized = new TextDecoder().decode(serializeNeuTreeTableJson(matrix).bytes);
    expect(JSON.parse(serialized)).toEqual([{
      numbers: [null, null, '3', null],
      nested: {
        a: { a: null, z: 1 },
        when: '2024-01-02T03:04:05.000Z',
        z: { a: null, z: 1 },
      },
      other: ['[object Set]', 'Symbol(label)', expect.stringContaining('callable')],
    }]);

    const circular: Record<string, unknown> = {};
    circular['self'] = circular;
    expect(() => serializeNeuTreeTableJson({
      columns: [{ key: 'value', header: 'Value' }],
      rows: [[circular]],
    })).toThrowError('Circular export value');

    const circularArray: unknown[] = [];
    circularArray.push(circularArray);
    expect(() => serializeNeuTreeTableJson({
      columns: [{ key: 'value', header: 'Value' }],
      rows: [[circularArray]],
    })).toThrowError('Circular export value');
  });

  it('returns bounded outcomes for disabled, SSR and destroyed export paths', async () => {
    const normalized = normalizeNeuTreeTableHierarchy(rows, (row) => row.id, hierarchy);
    const projection = projectNormalizedNeuTreeTableHierarchy(normalized, [1, 2]);
    const snapshot = {
      browser: true,
      active: () => true,
      mode: 'client' as const,
      request: {
        format: 'json' as const,
        scope: 'visible' as const,
        query: { page: 0, pageSize: 25, search: '', sort: [], filters: null },
      },
      options: { formats: ['json'] as const, defaultFilename: 'tree-table.json' },
      columns,
      projection,
      normalized,
      selection: { kind: 'keys', keys: [] } as const,
    };

    await expect(
      executeNeuTreeTableExport({
        ...snapshot,
        options: { formats: ['csv'], defaultFilename: 'tree-table.csv' },
      }),
    ).resolves.toMatchObject({ kind: 'outcome', outcome: { status: 'unsupported' } });
    await expect(
      executeNeuTreeTableExport({ ...snapshot, browser: false }),
    ).resolves.toMatchObject({ kind: 'outcome', outcome: { status: 'unsupported' } });
    await expect(
      executeNeuTreeTableExport({ ...snapshot, active: () => false }),
    ).resolves.toMatchObject({ kind: 'outcome', outcome: { status: 'failed' } });
  });
});
