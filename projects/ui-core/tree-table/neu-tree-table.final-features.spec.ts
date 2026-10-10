import { describe, expect, it, vi } from 'vitest';
import {
  buildNeuTreeTableEditCommit,
  createNeuTreeTableEditSession,
  neuTreeTableEditDraft,
  reconcileNeuTreeTableEditSession,
  treeEditStateToken,
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
  it('rejects absent and non-editable columns while allowing a row editing session', () => {
    expect(treeEditStateToken({ kind: 'none' })).toBeNull();
    expect(treeEditStateToken({ kind: 'row', key: 1 })).toContain('row|');
    expect(createNeuTreeTableEditSession({ kind: 'cell', key: 1, columnId: 'missing' }, rows[0]!, columns))
      .toBeNull();
    expect(createNeuTreeTableEditSession({ kind: 'cell', key: 1, columnId: 'amount' }, rows[0]!, columns))
      .toBeNull();
    expect(createNeuTreeTableEditSession({ kind: 'row', key: 1 }, rows[0]!, columns)?.entries.size)
      .toBe(1);
    expect(createNeuTreeTableEditSession({ kind: 'row', key: 1 }, rows[0]!, columns.slice(1)))
      .toBeNull();
  });

  it('reconciles parent value replacement without erasing a dirty edit', () => {
    const session = createNeuTreeTableEditSession({ kind: 'cell', key: 1, columnId: 'name' }, rows[0]!, columns)!;
    expect(reconcileNeuTreeTableEditSession(session, rows[0]!, columns)).toBe(session);
    const replaced = { ...rows[0]!, name: 'Parent update' };
    const clean = reconcileNeuTreeTableEditSession(session, replaced, columns);
    expect(clean.entries.get('name')).toMatchObject({ previous: 'Parent update', value: 'Parent update' });
    const dirty = updateNeuTreeTableEditDraft(session, 'name', 'Consumer draft');
    expect(updateNeuTreeTableEditDraft(dirty, 'name', 'Consumer draft')).toBe(dirty);
    expect(updateNeuTreeTableEditDraft(dirty, 'missing', 'ignored')).toBe(dirty);
    const reconciled = reconcileNeuTreeTableEditSession(dirty, replaced, columns);
    expect(reconciled.entries.get('name')).toMatchObject({ previous: 'Parent update', value: 'Consumer draft' });
    expect(reconcileNeuTreeTableEditSession(dirty, replaced, columns.slice(1)).entries.size).toBe(0);
    expect(neuTreeTableEditDraft(reconciled)).toMatchObject({ name: 'Consumer draft' });
  });

  it('validates missing fields and preserves a row edit when no custom validator exists', () => {
    const session = createNeuTreeTableEditSession({ kind: 'row', key: 1 }, rows[0]!, columns)!;
    expect(validateNeuTreeTableEdit(session, { mode: 'row' }, null))
      .toEqual({ session, valid: true });
    const calls: unknown[] = [];
    const validated = validateNeuTreeTableEdit(session, { mode: 'row', validate: (context) => {
      calls.push(context.field);
      return true;
    } }, 'missing');
    expect(validated.valid).toBe(true);
    expect(calls).toEqual([null]);
    const commit = buildNeuTreeTableEditCommit(session, columns);
    expect(commit).toMatchObject({ key: 1, value: rows[0], field: null, source: 'row' });
  });
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

  it('preserves typed spreadsheet cells and escapes mixed text values', () => {
    const bytes = serializeNeuTreeTableXlsx({
      columns: [{ key: 'value', header: 'Value' }],
      rows: [[true], [false], [new Date('2026-03-29T00:00:00.000Z')],
        [42n], [{ name: 'A&B' }], [Symbol('sample')], ['<x>"\'&'], [undefined]],
    }).bytes;
    const archive = new TextDecoder().decode(bytes);
    expect(archive).toContain('<c r="A2" t="b"><v>1</v></c>');
    expect(archive).toContain('<c r="A3" t="b"><v>0</v></c>');
    expect(archive).toContain('2026-03-29T00:00:00.000Z');
    expect(archive).toContain('Symbol(sample)');
    expect(archive).toContain('&lt;x&gt;&quot;&apos;&amp;');
    expect(archive).toContain('{&quot;name&quot;:&quot;A&amp;B&quot;}');
    expect(archive).not.toContain('<f>');
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

  it('delegates a remote export when selected keys are outside the loaded tree', async () => {
    const normalized = normalizeNeuTreeTableHierarchy(rows, (row) => row.id, hierarchy);
    const projection = projectNormalizedNeuTreeTableHierarchy(normalized, []);
    await expect(executeNeuTreeTableExport({
      browser: true,
      active: () => true,
      mode: 'remote',
      request: { format: 'csv', scope: 'selected', query: { page: 0, pageSize: 25, search: '', sort: [], filters: null } },
      options: { formats: ['csv'], defaultFilename: 'tree-table.csv' },
      columns,
      projection,
      normalized,
      selection: { kind: 'keys', keys: [1_000_000] },
    })).resolves.toEqual({ kind: 'delegated' });
  });

  it('serializes dates, booleans, bigint and structured values without losing CSV cell boundaries', () => {
    const result = serializeNeuTreeTableCsv({
      columns: [
        { key: 'date', header: 'Date' },
        { key: 'flag', header: 'Flag' },
        { key: 'count', header: 'Count' },
        { key: 'meta', header: 'Meta' },
      ],
      rows: [[new Date('2020-01-02T03:04:05.000Z'), true, 42n, { note: 'a,b' }]],
    });
    const text = new TextDecoder().decode(result.bytes);
    expect(text).toContain('2020-01-02T03:04:05.000Z');
    expect(text).toContain('"true","42"');
    expect(text).toContain('"{""note"":""a,b""}"');
  });

  it('downloads the selected export with the configured fallback filename', async () => {
    const normalized = normalizeNeuTreeTableHierarchy(rows, (row) => row.id, hierarchy);
    const projection = projectNormalizedNeuTreeTableHierarchy(normalized, []);
    const createObjectURL = vi.fn(() => 'blob:neu-export');
    const revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const previousCreate = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
    const previousRevoke = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: revokeObjectURL });
    try {
      const result = await executeNeuTreeTableExport({
        browser: true,
        active: () => true,
        mode: 'client',
        request: { format: 'csv', scope: 'selected', query: { page: 0, pageSize: 25, search: '', sort: [], filters: null } },
        options: { formats: ['csv'], defaultFilename: 'selected.csv' },
        columns,
        projection,
        normalized,
        selection: { kind: 'keys', keys: [1, 1, 2] },
      });
      expect(result).toMatchObject({ kind: 'outcome', outcome: { status: 'downloaded', filename: 'selected.csv', rowCount: 2 } });
      expect(click).toHaveBeenCalledOnce();
      expect(createObjectURL).toHaveBeenCalledOnce();
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:neu-export');
    } finally {
      if (previousCreate) Object.defineProperty(URL, 'createObjectURL', previousCreate);
      else Reflect.deleteProperty(URL, 'createObjectURL');
      if (previousRevoke) Object.defineProperty(URL, 'revokeObjectURL', previousRevoke);
      else Reflect.deleteProperty(URL, 'revokeObjectURL');
      click.mockRestore();
    }
  });
});
