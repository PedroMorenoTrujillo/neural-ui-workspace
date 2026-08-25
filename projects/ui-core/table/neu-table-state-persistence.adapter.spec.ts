import { describe, expect, it, vi } from 'vitest';
import { NeuTableStateController } from './neu-table-state.controller';
import { NeuTableStatePersistenceAdapter } from './neu-table-state-persistence.adapter';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length(): number {
    return this.values.size;
  }
  clear(): void {
    this.values.clear();
  }
  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.values.delete(key);
  }
  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('NeuTableStatePersistenceAdapter', () => {
  it('persists group expansion separately and never persists transient editing state', () => {
    const adapter = new NeuTableStatePersistenceAdapter();
    const controller = new NeuTableStateController<unknown>();
    controller.update(
      {
        editingKeys: new Set([1]),
        editingCell: { rowKey: 1, columnKey: 'name' },
        groupExpansionKeys: new Set(['Admin']),
      },
      'api',
    );
    const snapshot = adapter.snapshot(controller.snapshot());
    expect(snapshot.expandedGroupKeys).toEqual(['Admin']);
    expect(snapshot).not.toHaveProperty('editingKeys');
    expect(snapshot).not.toHaveProperty('editingCell');
  });
  it('round-trips the versioned row-data-free snapshot and skips semantic writes', () => {
    const controller = new NeuTableStateController<unknown>();
    controller.update(
      {
        page: 3,
        pageSize: 25,
        search: 'neural',
        sort: { key: 'name', dir: 'desc' },
        filters: {
          score: {
            operator: 'and',
            constraints: [{ mode: 'between', value: { from: 2, to: 8 } }],
          },
        },
        selectionKeys: new Set([1, 'remote-9']),
        expansionKeys: new Set([2, 'off-page-4']),
        layout: {
          columnOrder: ['name', 'score'],
          hiddenColumns: ['score'],
          columnWidths: { name: 220 },
        },
      },
      'api',
    );
    const storage = new MemoryStorage();
    const adapter = new NeuTableStatePersistenceAdapter();
    const setItem = vi.spyOn(storage, 'setItem');
    const snapshot = adapter.snapshot(controller.snapshot());

    expect(adapter.write(storage, 'table', snapshot)).toBe(true);
    expect(adapter.write(storage, 'table', snapshot)).toBe(false);
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(adapter.read(storage, 'table')).toEqual(snapshot);
    expect(JSON.parse(storage.getItem('table')!)).toMatchObject({
      schema: 'neu-table-state',
      version: 1,
      state: { selectionKeys: [1, 'remote-9'], expandedRowKeys: [2, 'off-page-4'] },
    });
    expect(storage.getItem('table')).not.toContain('rowData');
  });

  it('reports unsupported filters and non-JSON keys instead of corrupting them', () => {
    const controller = new NeuTableStateController<unknown>();
    const cyclic: Record<string, unknown> = {};
    cyclic['self'] = cyclic;
    controller.update(
      {
        filters: {
          safe: { operator: 'and', constraints: [{ value: ['a', 2, true] }] },
          unsafe: { operator: 'and', constraints: [{ value: cyclic }] },
        },
        selectionKeys: new Set([1, { id: 2 }]),
        expansionKeys: new Set(['known', Symbol('opaque')]),
      },
      'api',
    );

    const snapshot = new NeuTableStatePersistenceAdapter().snapshot(controller.snapshot());

    expect(snapshot.filters).toEqual({
      safe: { operator: 'and', constraints: [{ value: ['a', 2, true] }] },
    });
    expect(snapshot.omissions).toEqual({
      filterKeys: ['unsafe'],
      selectionKeyCount: 1,
      expandedRowKeyCount: 1,
    });
  });

  it('ignores malformed and future envelopes and contains storage failures', () => {
    const storage = new MemoryStorage();
    const adapter = new NeuTableStatePersistenceAdapter();
    storage.setItem('future', JSON.stringify({ schema: 'neu-table-state', version: 2, state: {} }));
    storage.setItem('broken', '{');

    expect(adapter.read(storage, 'future')).toBeNull();
    expect(adapter.read(storage, 'broken')).toBeNull();

    const throwing = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    } as unknown as Storage;
    const snapshot = adapter.snapshot(new NeuTableStateController().snapshot());
    expect(adapter.read(throwing, 'table')).toBeNull();
    expect(adapter.write(throwing, 'table', snapshot)).toBe(false);
    expect(adapter.clear(throwing, 'table')).toBe(false);
  });

  it('compares plain object filter values by persisted semantics', () => {
    const adapter = new NeuTableStatePersistenceAdapter();
    expect(
      adapter.valuesEqual({ id: 1, meta: { active: true } }, { meta: { active: true }, id: 1 }),
    ).toBe(true);
    expect(adapter.valuesEqual({ id: 1 }, { id: 2 })).toBe(false);
    expect(
      adapter.valuesEqual(
        () => 1,
        () => 1,
      ),
    ).toBe(false);
  });

  it('handles absent storage, empty keys, missing values, and clear lifecycle boundaries', () => {
    const adapter = new NeuTableStatePersistenceAdapter();
    const storage = new MemoryStorage();
    const snapshot = adapter.snapshot(new NeuTableStateController().snapshot());

    expect(adapter.read(null, 'table')).toBeNull();
    expect(adapter.read(storage, '')).toBeNull();
    expect(adapter.read(storage, 'missing')).toBeNull();
    expect(adapter.write(null, 'table', snapshot)).toBe(false);
    expect(adapter.write(storage, '', snapshot)).toBe(false);
    expect(adapter.clear(null, 'table')).toBe(false);
    expect(adapter.clear(storage, '')).toBe(false);
    expect(adapter.clear(storage, 'missing')).toBe(false);
    expect(adapter.write(storage, 'table', snapshot)).toBe(true);
    expect(adapter.clear(storage, 'table')).toBe(true);
    expect(storage.getItem('table')).toBeNull();
  });

  it('projects supported JSON values and omits every unsupported filter shape', () => {
    class CustomValue {}
    const controller = new NeuTableStateController<unknown>();
    controller.update(
      {
        filters: {
          supported: {
            operator: 'or',
            constraints: [
              { value: null },
              { value: 'text' },
              { value: false },
              { value: 3.5 },
              { value: new Date('2026-01-02T03:04:05.000Z') },
              { value: Object.assign(Object.create(null), { nested: ['x', { ok: true }] }) },
            ],
          },
          infinite: { operator: 'and', constraints: [{ value: Number.POSITIVE_INFINITY }] },
          invalidDate: { operator: 'and', constraints: [{ value: new Date('invalid') }] },
          symbol: { operator: 'and', constraints: [{ value: Symbol('x') }] },
          custom: { operator: 'and', constraints: [{ value: new CustomValue() }] },
          badArray: { operator: 'and', constraints: [{ value: [1, undefined] }] },
          badObject: { operator: 'and', constraints: [{ value: { ok: true, bad: 1n } }] },
        },
        layout: { columnOrder: [], hiddenColumns: [], columnWidths: { good: 120, bad: NaN } },
      },
      'api',
    );

    const snapshot = new NeuTableStatePersistenceAdapter().snapshot(controller.snapshot());

    expect(snapshot.filters['supported'].constraints.map((constraint) => constraint.value)).toEqual(
      [null, 'text', false, 3.5, '2026-01-02T03:04:05.000Z', { nested: ['x', { ok: true }] }],
    );
    expect(snapshot.omissions.filterKeys).toEqual([
      'infinite',
      'invalidDate',
      'symbol',
      'custom',
      'badArray',
      'badObject',
    ]);
    expect(snapshot.layout.columnWidths).toEqual({ good: 120 });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.filters['supported'].constraints)).toBe(true);
  });

  it('rejects malformed version-one snapshots at every structural boundary', () => {
    const adapter = new NeuTableStatePersistenceAdapter();
    const storage = new MemoryStorage();
    const snapshot = adapter.snapshot(new NeuTableStateController().snapshot());
    const envelope = { schema: 'neu-table-state', version: 1, state: snapshot };
    const readState = (state: unknown) => {
      storage.setItem('case', JSON.stringify({ ...envelope, state }));
      return adapter.read(storage, 'case');
    };
    const mutate = (change: (state: any) => void) => {
      const state = structuredClone(snapshot) as any;
      change(state);
      return readState(state);
    };

    expect(readState(null)).toBeNull();
    expect(mutate((state) => (state.version = 0))).toBeNull();
    expect(mutate((state) => (state.page = '1'))).toBeNull();
    expect(mutate((state) => (state.pageSize = Infinity))).toBeNull();
    expect(mutate((state) => (state.sort = { key: 'id', dir: 'sideways' }))).toBeNull();
    expect(mutate((state) => (state.sortEntries = null))).toBeNull();
    expect(mutate((state) => (state.sortEntries = [{ key: 1, dir: 'asc' }]))).toBeNull();
    expect(mutate((state) => (state.filters = []))).toBeNull();
    expect(
      mutate((state) => (state.filters = { id: { operator: 'xor', constraints: [] } })),
    ).toBeNull();
    expect(
      mutate((state) => (state.filters = { id: { operator: 'and', constraints: null } })),
    ).toBeNull();
    expect(
      mutate(
        (state) => (state.filters = { id: { operator: 'and', constraints: [{ mode: 'equals' }] } }),
      ),
    ).toBeNull();
    expect(mutate((state) => (state.selectionKeys = null))).toBeNull();
    expect(mutate((state) => (state.expandedRowKeys = null))).toBeNull();
    expect(mutate((state) => (state.layout = null))).toBeNull();
    expect(mutate((state) => (state.omissions = null))).toBeNull();
    expect(mutate((state) => (state.layout.columnOrder = [1]))).toBeNull();
    expect(mutate((state) => (state.layout.hiddenColumns = 'id'))).toBeNull();
    expect(mutate((state) => (state.layout.columnWidths = []))).toBeNull();
    expect(mutate((state) => (state.omissions.filterKeys = [false]))).toBeNull();
  });

  it('normalizes tolerated persisted values and compares nested arrays and objects', () => {
    const adapter = new NeuTableStatePersistenceAdapter();
    const storage = new MemoryStorage();
    const snapshot = adapter.snapshot(new NeuTableStateController().snapshot());
    const state: any = structuredClone(snapshot);
    state.page = -4.7;
    state.pageSize = 0;
    state.search = 7;
    state.sort = null;
    state.sortEntries = [{ key: 'name', dir: 'desc' }];
    state.filters = {
      role: { operator: 'or', constraints: [{ mode: 12, value: 'admin' }] },
    };
    state.selectionKeys = [1, 'two', true, null, Infinity, {}, undefined];
    state.expandedRowKeys = [false, 4, NaN];
    state.layout.columnWidths = { good: 90, text: '90', infinite: Infinity };
    state.omissions.selectionKeyCount = -3.8;
    state.omissions.expandedRowKeyCount = '4';
    storage.setItem('table', JSON.stringify({ schema: 'neu-table-state', version: 1, state }));

    expect(adapter.read(storage, 'table')).toEqual(
      expect.objectContaining({
        page: 1,
        pageSize: 1,
        search: '',
        sortEntries: [{ key: 'name', dir: 'desc' }],
        selectionKeys: [1, 'two', true, null, null, null],
        expandedRowKeys: [false, 4, null],
        layout: expect.objectContaining({ columnWidths: { good: 90 } }),
        omissions: expect.objectContaining({ selectionKeyCount: 0, expandedRowKeyCount: 0 }),
      }),
    );
    expect(adapter.valuesEqual([1, { a: true }], [1, { a: true }])).toBe(true);
    expect(adapter.valuesEqual([1], [1, 2])).toBe(false);
    expect(adapter.valuesEqual([1], { 0: 1 })).toBe(false);
    expect(adapter.valuesEqual({ a: 1 }, { b: 1 })).toBe(false);
    expect(adapter.valuesEqual(NaN, NaN)).toBe(false);
  });
});
