import { loadNeuTableExportSerializer } from './internal/export/neu-table-export-loader';
import {
  createNeuTableExportMatrix,
  projectNeuTableExport,
} from './internal/export/neu-table-export-projection';
import { serializeNeuTableCsv } from './internal/features/export/neu-table-csv-export';
import { serializeNeuTableJson } from './internal/features/export/neu-table-json-export';
import { serializeNeuTableXlsx } from './internal/features/export/neu-table-xlsx-export';
import type {
  NeuTableColumn,
  NeuTableExportFormat,
  NeuTableExportRequest,
  NeuTableExportScope,
  NeuTableFilterOptions,
  NeuTableQuery,
  NeuTableSelection,
} from './public/neu-table.types';

interface Row {
  readonly id: number;
  readonly name: string;
  readonly score: number;
  readonly pin?: 'start' | 'end';
}

type Field = 'id' | 'name' | 'score';

const rows: readonly Row[] = [
  { id: 0, name: 'Pinned start', score: 0, pin: 'start' },
  { id: 1, name: 'Ada', score: 20 },
  { id: 2, name: 'Grace', score: 10 },
  { id: 3, name: 'Linus', score: 30 },
  { id: 5, name: 'Pinned end', score: 0, pin: 'end' },
];

const columns: readonly NeuTableColumn<Row, Field>[] = [
  { id: 'score', header: 'Score', field: 'score' },
  { id: 'name', header: 'Display name', value: (row) => row.name },
  { id: 'actions', header: 'Actions' },
];

const filterOptions: NeuTableFilterOptions<Row, Field> = {
  surfaces: [],
  globalFields: ['name'],
  predicates: {},
  debounceMs: 0,
  commit: 'immediate',
};

const baseQuery: NeuTableQuery<Field> = {
  page: 0,
  pageSize: 2,
  search: '',
  sort: [{ field: 'score', direction: 'desc' }],
  filters: {
    kind: 'condition',
    field: 'score',
    rule: 'greaterThan',
    value: 10,
  },
};

function request(
  scope: NeuTableExportScope,
  format: NeuTableExportFormat = 'json',
  query: NeuTableQuery<Field> = baseQuery,
): NeuTableExportRequest<Field> {
  return { format, scope, fileName: `people.${format}`, query };
}

function projectionOptions(
  scope: NeuTableExportScope,
  overrides: {
    readonly dataMode?: 'client' | 'remote';
    readonly metadataTotal?: number | null;
    readonly selection?: NeuTableSelection<number, Field>;
    readonly virtual?: boolean;
    readonly queryMatchesApplied?: boolean;
  } = {},
) {
  return {
    request: request(scope),
    dataMode: overrides.dataMode ?? ('client' as const),
    data: rows,
    metadata: {
      totalItems: overrides.metadataTotal ?? rows.length,
      loading: false,
      error: null,
      queryRevision: 0,
      appliedRequestId: null,
    },
    queryMatchesApplied: overrides.queryMatchesApplied ?? true,
    columns,
    selection: overrides.selection ?? ({ kind: 'keys', keys: [] } as const),
    rowKey: (row: Row) => row.id,
    rowOptions: { reorderable: false, pin: (row: Row) => row.pin ?? null },
    sortOptions: {
      mode: 'multiple' as const,
      removable: true,
      defaultDirection: 'asc' as const,
      resetPageOnChange: true,
    },
    filterOptions,
    paginationOptions: {
      enabled: true,
      pageSizeOptions: [2],
      position: 'bottom' as const,
      report: 'none' as const,
      showPageJump: false,
    },
    virtualizationOptions: overrides.virtual
      ? ({ enabled: true, itemSize: 40, overscan: 2 } as const)
      : ({ enabled: false } as const),
  };
}

function ids(projection: ReturnType<typeof projectNeuTableExport<Row, number, Field>>): number[] {
  return projection.kind === 'local' ? projection.rows.map((row) => row.id) : [];
}

describe('NeuTable export projection', () => {
  it('uses the approved query pipeline, page semantics and domain columns', () => {
    const filtered = projectNeuTableExport(projectionOptions('filtered'));
    const page = projectNeuTableExport(projectionOptions('page'));

    expect(ids(filtered)).toEqual([0, 3, 1, 5]);
    expect(ids(page)).toEqual([0, 3, 1, 5]);
    expect(filtered.kind === 'local' ? filtered.columns.map((column) => column.key) : []).toEqual([
      'score',
      'name',
    ]);
  });

  it('exports client logical rows rather than the virtual DOM window', () => {
    const projection = projectNeuTableExport(projectionOptions('page', { virtual: true }));
    expect(ids(projection)).toEqual([0, 3, 1, 5]);
  });

  it('projects keys and all-matching selection without private or synthetic state', () => {
    const keys = projectNeuTableExport(
      projectionOptions('selected', { selection: { kind: 'keys', keys: [3, 0] } }),
    );
    const allMatching = projectNeuTableExport(
      projectionOptions('selected', {
        selection: {
          kind: 'all-matching',
          scope: { search: 'a', filters: null, globalFields: ['name'] },
          excludedKeys: [2],
        },
      }),
    );

    expect(ids(keys)).toEqual([0, 3]);
    expect(ids(allMatching)).toEqual([0, 1]);
  });

  it('delegates remote data it does not own without allocating totalItems', () => {
    expect(
      projectNeuTableExport(
        projectionOptions('all', { dataMode: 'remote', metadataTotal: 1_000_000 }),
      ).kind,
    ).toBe('delegated');
    expect(
      projectNeuTableExport(
        projectionOptions('filtered', { dataMode: 'remote', metadataTotal: 1_000_000 }),
      ).kind,
    ).toBe('delegated');
    expect(
      projectNeuTableExport(
        projectionOptions('selected', {
          dataMode: 'remote',
          metadataTotal: 1_000_000,
          selection: { kind: 'all-matching', scope: { search: '', filters: null, globalFields: [] }, excludedKeys: [] },
        }),
      ).kind,
    ).toBe('delegated');
    expect(
      ids(
        projectNeuTableExport(
          projectionOptions('loaded', { dataMode: 'remote', metadataTotal: 1_000_000 }),
        ),
      ),
    ).toEqual([0, 1, 2, 3, 5]);
  });

  it('builds one deterministic matrix from the approved accessors', () => {
    const projection = projectNeuTableExport(projectionOptions('selected', {
      selection: { kind: 'keys', keys: [1] },
    }));
    expect(projection.kind).toBe('local');
    if (projection.kind !== 'local') return;
    expect(createNeuTableExportMatrix(projection)).toEqual({
      columns: [
        { key: 'score', header: 'Score' },
        { key: 'name', header: 'Display name' },
      ],
      rows: [[20, 'Ada']],
    });
  });
});

describe('NeuTable private export serializers', () => {
  const matrix = {
    columns: [
      { key: 'name', header: 'Name' },
      { key: 'note', header: 'Note' },
    ],
    rows: [
      ['=1+1,"x"\r\ny', null],
      ['Unicode 😀', { z: 1, a: 2 }],
    ],
  } as const;

  it('serializes deterministic secure CSV with BOM, CRLF, quoting and formula escaping', () => {
    const result = serializeNeuTableCsv(matrix);
    expect(result.mediaType).toBe('text/csv;charset=utf-8');
    expect(Array.from(result.bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
    expect(new TextDecoder().decode(result.bytes)).toBe(
      '"Name","Note"\r\n"\'=1+1,""x""\r\ny",""\r\n"Unicode 😀","{""z"":1,""a"":2}"',
    );
  });

  it('serializes projected JSON with deterministic column and nested-object ordering', () => {
    const result = serializeNeuTableJson(matrix);
    expect(JSON.parse(new TextDecoder().decode(result.bytes))).toEqual([
      { name: '=1+1,"x"\r\ny', note: null },
      { name: 'Unicode 😀', note: { a: 2, z: 1 } },
    ]);
  });

  it('serializes mixed scalar, date, array and non-plain values without losing column positions', () => {
    const values = [undefined, Number.NaN, Number.POSITIVE_INFINITY, 42n,
      new Date('2026-03-29T00:00:00.000Z'), [1, undefined, { b: 2, a: 1 }],
      new Map([['a', 1]])];
    const exported = serializeNeuTableJson({
      columns: values.map((_, index) => ({ key: `c${index}`, header: `Column ${index}` })),
      rows: [values],
    });
    expect(JSON.parse(new TextDecoder().decode(exported.bytes))).toEqual([{
      c0: null, c1: null, c2: null, c3: '42',
      c4: '2026-03-29T00:00:00.000Z', c5: [1, null, { a: 1, b: 2 }],
      c6: '[object Map]',
    }]);
  });

  it('rejects cycles in either arrays or objects while allowing repeated shared values', () => {
    const cyclicArray: unknown[] = [];
    cyclicArray.push(cyclicArray);
    const cyclicObject: Record<string, unknown> = {};
    cyclicObject['self'] = cyclicObject;
    const oneColumn = { columns: [{ key: 'value', header: 'Value' }] };
    expect(() => serializeNeuTableJson({ ...oneColumn, rows: [[cyclicArray]] }))
      .toThrow('Circular export value');
    expect(() => serializeNeuTableJson({ ...oneColumn, rows: [[cyclicObject]] }))
      .toThrow('Circular export value');
    const shared = { name: 'same' };
    expect(JSON.parse(new TextDecoder().decode(serializeNeuTableJson({
      ...oneColumn, rows: [[[shared, shared]]],
    }).bytes))).toEqual([{ value: [{ name: 'same' }, { name: 'same' }] }]);
  });

  it('creates a valid stored XLSX archive without implicit formulas', () => {
    const result = serializeNeuTableXlsx(matrix);
    const archiveText = new TextDecoder().decode(result.bytes);
    expect(Array.from(result.bytes.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
    expect(archiveText).toContain('[Content_Types].xml');
    expect(archiveText).toContain('xl/worksheets/sheet1.xml');
    expect(archiveText).toContain('t="inlineStr"');
    expect(archiveText).toContain('=1+1');
    expect(archiveText).not.toContain('<f>');
  });

  it('keeps lazy-load attempts independent and retryable', async () => {
    let attempts = 0;
    const loaders = {
      csv: async () => {
        attempts += 1;
        if (attempts === 1) throw new Error('chunk');
        return serializeNeuTableCsv;
      },
      json: async () => serializeNeuTableJson,
      xlsx: async () => serializeNeuTableXlsx,
    };

    await expect(loadNeuTableExportSerializer('csv', loaders)).rejects.toThrow('chunk');
    await expect(loadNeuTableExportSerializer('csv', loaders)).resolves.toBe(
      serializeNeuTableCsv,
    );
    expect(attempts).toBe(2);
  });
});
